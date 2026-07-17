---
name: kingdee-field-rules
description: >
  金蝶云星空查询的字段命名规则、metadata Key转换规则、常见错误字段映射、以及查询最佳实践。
  本技能始终加载，用于在任何对话中快速纠正字段名错误。
metadata:
  cowagent:
    emoji: "📐"
    always: true
---

# 金蝶字段规则速查

## 第 0 条 — 禁止猜测字段名（最重要的规则）

> 所有 `field_keys` 必须来自 `verified-fields.md` 的 ✅ 表格、`query_metadata` 的 `Key` 返回值、或本文件的示例。
> **不允许凭训练数据中的记忆构造字段名**。
>
> 如果无法从上述来源确认字段名，必须用 `query_metadata(form_id)` 验证后再使用。

---

## metadata Key 转换规则（解决"元数据中标识为XXX的字段不存在"）

`query_metadata` 返回的 `Key` 是 **元数据标识符**，不能直接用于查询！需按以下规则转换：

### 转换三步法

| 情况 | 元数据 Key | 查询字段名 | 规则 |
|------|-----------|-----------|------|
| 标准字段 | `FBillNo` | `FBillNo` | 直接使用，无需转换 |
| 自定义字段 | `F_JR_FHTZDKYL1` | `F_JR_FHTZDKYL1` | `F_` 开头，Key 即查询名，直接使用 |
| 弹性/辅助属性（双下划线） | `FAUXPROPID__FF100001` | `FAuxPropId.FF100001.FName` | ① `__` 分割 → ② 前半段转驼峰（`FAUXPROPID`→`FAuxPropId`） → ③ 后半段就是 FieldName → ④ 关联档案加 `.FName` / `.FNumber` |
| 弹性仓位（双下划线） | `FSTOCKLOCID__FF100004` | `FStockLocId.FF100004.FName` | 同上转换规则 |
| 关联字段 | `FCUSTID`（元数据中） | `FCustId.FName` | 加 `.FName`(名称) 或 `.FNumber`(编码) 后缀 |

### 转换口诀

```
双线下划线，一分为二看：
  前半转驼峰 → FAUXPROPID → FAuxPropId
  后半是字段 → FF100001 → 原样写
  关联.后缀  → .FName / .FNumber
```

### 常见错误

| ❌ 错误写法 | ✅ 正确写法 | 错误原因 |
|------------|-----------|---------|
| `FAUXPROPID__FF100001` | `FAuxPropId.FF100001.FName` | 元数据 Key 直接当查询字段 |
| `FAuxPropId` | `FAuxPropId.FF100001.FName` | 弹性父键，要用子字段 |
| `FAuxPropId__FF100001` | `FAuxPropId.FF100001.FName` | 混合格式 |

---

## 利用 500 错误消息定位错字段

> 金蝶 500 错误消息中 **已经告诉了你哪个字段错了**，仔细看！

```json
// 错误消息中的关键信息
{"Message": "元数据中标识为 FCustomerID 的字段不存在"}
                                ↑ 这个就是错字段名，记下来

{"Message": "元数据中标识为 FAUXPROPID__FF100001 的字段不存在"}
                                ↑ 这个也是错字段名
```

### 修复步骤

1. **提取错误消息中的字段名**：在 `标识为` 后面找到出错字段
2. **查询正确替代**：
   - 在 `verified-fields.md` 的 ❌ 禁用表中查找对应正确写法
   - 或查本文件的 metadata 转换规则表
   - 或调用 `query_metadata(form_id)` 查看元数据确认
3. **替换错误字段后重试**：只替换出错的字段，不要整体重写查询

> **重要**：不要盲目重试整条查询！如果 `field_keys` 中有多个可疑字段，先只用 1 个字段测试，确认正确再逐一添加。

---

## 通用字段（所有单据可用）

| 字段名 | 含义 | 注意事项 |
|--------|------|---------|
| `FBillNo` | 单据编号 | 所有单据都有 |
| `FDate` | 单据业务日期 | 手填日期 |
| `FCreateDate` | 系统创建时间 | 按"今天开的单"统计用此字段 |
| `FDocumentStatus` | 状态码 | Z=暂存 A=创建 B=审核中 C=已审核 D=重新审核 |
| `FCreatorId.FName` | 创建人 | 关联字段 |
| `FApproverId.FName` | 审核人 | 关联字段 |
| `FApproveDate` | 审核日期 | |

---

## 高频错误字段速查（解决 70% 的报错）

| ❌ 错误写法 | ✅ 正确写法 | 所属表单 |
|------------|-----------|---------|
| `FCustomerID` / `FCustomerId` | `FCustId.FName` | SAL_SaleOrder |
| `FSaleAmount` / `FTotalAmount` | `FAllAmount`（行级） | SAL_SaleOrder |
| `FApproveStatus` | `FDocumentStatus` | 所有单据 |
| `FNumber`（库存表中） | `FMaterialId.FNumber` | STK_Inventory |
| `FStockQty` | `FBaseQty` | STK_Inventory |
| `FAvailableQty` | `FAVBQty` | STK_Inventory |
| `FCustId.FName`（出库单中） | **不存在**，需从关联订单获取 | SAL_OUTSTOCK |
| `FAllQty`（出库单中） | **不存在** | SAL_OUTSTOCK |
| `FAuxPropId`（弹性父键） | `FAuxPropId.FF100001.FName` | STK_Inventory |
| `FStockLocId`（弹性父键） | `FStockLocId.FF100004.FName` | STK_Inventory |
| `FAUXPROPID__FF100001` | `FAuxPropId.FF100001.FName` | 任何弹性字段 |

---

## 先用 `top_count=1` 测试新字段（避免大批量报错重查）

> 任何使用了 `verified-fields.md` 之外的字段组合，**先用 `top_count=1` 小范围测试**，确认不报 500 后再扩大范围。

```python
# 第一步：小范围测试新字段
test = query_bill_json(
    form_id="SAL_SaleOrder",
    field_keys="FBillNo,你怀疑的新字段",
    filter_string="FDate >= '2026-07-01' AND FDate < '2026-07-02'",
    top_count=1     # ← 关键！只查一行
)
# 如果返回 success，确认字段可用
# 如果返回 500，从错误消息中找到错字段名，替换后重试

# 第二步：确认后扩大范围
data = query_bill_all(
    form_id="SAL_SaleOrder",
    field_keys="FBillNo,你怀疑的新字段",
    filter_string="FDate >= '2026-01-01' AND FDate < '2026-07-01'"
)
```

> 小范围测试仅耗时约 0.5 秒，但能避免大量数据返工。

---

## FAllAmount — 行级字段不同场景的分组规则

`FAllAmount` 是 **行级（明细）字段**，同一订单不同物料对应不同金额。不同分析场景的处理方式不同：

| 场景 | 正确做法 | 常见错误 |
|------|---------|---------|
| 统计客户/业务员的订单总额 | 先按 `FBillNo` 分组求订单总额，**再**按 `FCustId.FName`（客户）分组汇总 | 直接按客户求和 → 多行重复金额，结果翻倍 |
| 统计产品（物料）的销售金额 | 直接按 `FMaterialId.FName` 汇总行级 `FAllAmount` | 不需要按 FBillNo 去重 |
| 查询订单列表展示 | 带行号 `FSeq` 展示每行，指出同一订单多行 | 误以为是订单总额 |
| 综合统计（如经营日报） | 先按 `FBillNo` 去重合并，再做汇总 | 重复计算 |

---

## FDate 与 FCreateDate 的差异

| 字段 | 含义 | 何时用 |
|------|------|--------|
| `FDate` | 业务日期（手动填写） | 按"业务发生时间"统计、业务方要求的日期 |
| `FCreateDate` | 系统创建时间 | 按"今天开了多少单"统计、工作量考核 |

> ❗ 用 `FCreateDate` 过滤"今天"的单据，比 `FDate` 更准确（FDate 可能填昨天的日期）。
> ❗ 不要同时查询 `FDate` 和 `FCreateDate`，选一个即可。

---

## 查询参数最佳实践

```python
# ✅ 推荐：加 field_order 排序，用 FDocumentStatus 过滤草稿
query_bill_json(
    form_id="SAL_SaleOrder",
    field_keys="FBillNo,FDate,FCustId.FName,FAllAmount,FDocumentStatus",
    filter_string="FDate >= '2026-01-01' AND FDate < '2026-02-01' AND FDocumentStatus = 'C'",
    top_count=200,
    field_order="FDate"     # ← 按日期排序
)

# ❌ 不推荐：不加排序、不过滤草稿
query_bill_json(
    form_id="SAL_SaleOrder",
    field_keys="FBillNo,FDate,FCustId.FName,FAllAmount",
    filter_string="FDate >= '2026-01-01' AND FDate < '2026-02-01'",
    top_count=200
)
```

**推荐参数：**
- `FDocumentStatus = 'C'`：过滤掉暂存/草稿/创建中的单据（只查已审核）
- `field_order="FDate"`：按日期排序，减少后续处理
- `FCloseStatus`：判断订单是否已关闭

---

## "查不到数据" vs "查询出错" — 区分指引

| 返回结果 | 含义 | 下一步 |
|---------|------|--------|
| `{"rows": [], "row_count": 0}` | ✅ **查询成功**，没有符合条件的记录 | 告诉用户"没有找到匹配的单据"，建议放宽时间范围或检查条件 |
| `{"ErrorCode": 500, "Message": ...}` | ❌ **查询失败**，字段或表单ID有问题 | 从 `Message` 中提取错字段名，用本文件的规则修复后重试 |
| `{"ErrorCode": 500, "Message": "业务对象不存在"}` | ❌ **表单ID错了** | 查 SKILL.md 表单速查表确认正确ID |

> **不要混滑两者！** 空结果 ≠ 错误。看到 `row_count=0` 直接告诉用户，不需要重试。
