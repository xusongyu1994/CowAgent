---
name: kingdee-query
description: >
  查询金蝶云星空 ERP 数据。适用场景：
  - 查询销售订单、销售出库、发货通知
  - 查询客户信息、客户生日
  - 查询物料信息、库存数量
  - 查询采购订单、采购入库
  - 查询应收账款、逾期账款
  - 生成经营日报、销售分析报表
  - 追踪订单状态、预警逾期交货
  触发关键词：金蝶、销售订单、客户、物料、库存、采购、出库、入库、应收账款、逾期、经营日报
metadata:
  cowagent:
    emoji: "🔍"
    always: false
---

# 金蝶云星空 ERP 查询技能

通过 MCP 工具与金蝶云星空 API 交互的核心指南。查询前务必先查阅本文件确认表单ID和字段命名规则，避免 500 错误。

> **前提条件**：本 Skill 需配合金蝶云星空 MCP Server 使用。确保已配置好 MCP Server 并可访问 `query_bill_json`、`view_bill`、`count_bill`、`query_bill_all` 等工具。MCP Server 版本需 >= v1.2.0（推荐 v1.3.2+）。

---

## 核心原则

1. **分步查询**：先用 `query_bill_json` / `query_bill_all` 查列表（关键字段），再用 `view_bill` 看单条详情
2. **日期过滤**：半开区间 `FDate >= 'YYYY-MM-DD' AND FDate < 'YYYY-MM-DD+1'`
3. **FDate vs FCreateDate**：`FDate` 是业务日期（手填），`FCreateDate` 是系统创建时间。按"今天开的单"统计用 `FCreateDate`
4. **单据状态码**：`Z` = 暂存草稿，`A` = 创建，`B` = 审核中，`C` = 已审核，`D` = 重新审核
5. **控制数据量**：`top_count` 限制行数，只查必要字段，超过20行数据考虑创建 Excel
6. **字段不确定时**：先调用 `query_metadata(form_id)` 验证字段是否存在，避免试错
7. **优先使用高阶查询工具**（v1.2.0+）：`count_bill` 预判数据量 → `query_bill_all` 自动翻页全量查询 → `query_bill_to_file` 万行以上导出到文件

---

## 大数据量查询流程

> **关键限制**：金蝶 `ExecuteBillQuery` 单次最多返回约 2000 行；MCP tool-result 上限 1MB。
>
> **推荐工具**（v1.2.0+）：`query_bill_all`（自动翻页）、`query_bill_range`（日期分片+翻页）、`query_bill_to_file`（流式导出）。这些工具封装了翻页逻辑，无需手动循环。

### 决策树

```
① 时间跨度 > 1 周，或不确定数据量 → 先 count_bill(form_id, filter_string) 估算行数
② estimated_rows ≤ 2000（is_exact=true） → 直接用 query_bill_json，top_count=2000
③ estimated_rows > 2000 且为月度查询（30天内） → 使用 query_bill_all 自动翻页
④ 跨季度/跨年（>90天）→ 使用 query_bill_range 按日期分片自动查询
⑤ 预计行数 > 10000（万行以上）→ 使用 query_bill_to_file 流式导出到文件，避免 tool-result 超限
⑥ 累计行数 > 20 行且需给用户展示 → 必须写入 Excel / CSV 文件
```

### 时间跨度 vs 推荐策略

| 时间跨度 | 推荐做法 | 工具 |
|---------|---------|------|
| 当日/当日 | `top_count=200` 直接查 | `query_bill_json` |
| 当周 | `top_count=1000` 直接查 | `query_bill_json` |
| 当月（≤2000行） | `count_bill` 预判，直接查 | `query_bill_json` |
| 当月（>2000行） | 自动翻页全量查询 | `query_bill_all` |
| 跨季度/跨年 | 日期分片+自动翻页 | `query_bill_range` |
| 万行以上 | 流式导出到文件 | `query_bill_to_file` |

---

## 表单ID速查表

### 基础数据

| 中文名称 | 表单ID | 备注 |
|---------|--------|------|
| 物料 | `BD_MATERIAL` | |
| 客户 | `BD_Customer` | 详见 references/customer-query-guide.md |
| 供应商 | `BD_Supplier` | |
| 部门 | `BD_Department` | |
| 员工 | `BD_Empinfo` | |

### 销售模块

| 中文名称 | 表单ID | 备注 |
|---------|--------|------|
| 销售订单 | `SAL_SaleOrder` | |
| 销售出库单 | `SAL_OUTSTOCK` | **不是** STK_OutStock |
| 发货通知单 | `SAL_DELIVERYNOTICE` | |

### 采购模块

| 中文名称 | 表单ID | 备注 |
|---------|--------|------|
| 采购订单 | `PUR_PurchaseOrder` | |
| 采购入库单 | `STK_InStock` | 非 PUR_ReceiveBill（该ID返回空） |
| 采购申请单 | `PUR_Requisition` | |

### 库存/财务

| 中文名称 | 表单ID | 备注 |
|---------|--------|------|
| 库存明细 | `STK_Inventory` | 非物料档案，字段不同 |
| 其他入库单 | `STK_InStock` | |
| 其他出库单 | `STK_OutStock` | 注意：销售出库是 SAL_OUTSTOCK |
| 应收单 | `AR_receivable` | |
| 付款单 | `AP_PAYBILL` | |

---

## 字段命名规则

- **所有字段以 `F` 开头**，区分大小写
- **关联字段**加后缀获取属性：`FCustId.FName`（名称）、`FCustId.FNumber`（编码）
- **表体明细**：`query_bill_json` 返回行级展开数据，同一 FBillNo 可能出现多行
- **自定义字段**：以 `F_` + 前缀开头（各部署不同），可用 `query_metadata` 发现

### 通用字段（所有单据可用）

| 字段名 | 含义 |
|--------|------|
| `FBillNo` | 单据编号 |
| `FDate` | 单据业务日期 |
| `FCreateDate` | 系统创建时间 |
| `FDocumentStatus` | 状态（Z/A/B/C/D） |
| `FCreatorId.FName` | 创建人 |
| `FApproverId.FName` | 审核人 |
| `FApproveDate` | 审核日期 |

---

## 已验证字段列表

> 详细字段列表请查阅 `references/verified-fields.md`
> - 标记 ✅ 的可直接使用
> - 标记 ❌ 的会触发500错误，**禁止使用**
> - 字段不确定时：调用 `query_metadata(form_id)` 实时验证

### 销售订单 SAL_SaleOrder

**✅ 已验证可用字段**：
- `FBillNo`（单据编号）、`FDate`（单据日期）、`FCreateDate`（创建时间）
- `FDocumentStatus`（状态）、`FAllAmount`（含税合计，行级字段）
- `FCustId.FName`（客户名称）、`FCustId.FNumber`（客户编号）
- `FSalerId.FName`（业务员名称）、`FSaleDeptId.FName`（销售部门）

**❌ 禁用字段**：
- `FCustomerID` / `FCustomerId` → 正确写法：`FCustId`
- `FSaleAmount` → 正确写法：`FAllAmount` 或 `FAmount`
- `FApproveStatus` → 正确写法：`FDocumentStatus`

### 销售出库单 SAL_OUTSTOCK

**✅ 已验证可用字段**：
- `FBillNo`、`FDate`、`FCreateDate`、`FDocumentStatus`
- `FCreatorId.FName`（开单人姓名）、`FStockId.FName`（仓库名称）

**❌ 禁用字段**：
- `FCustId.FName` → 在 SAL_OUTSTOCK 中**不存在**

### 库存查询 STK_Inventory

**✅ 已验证可用字段**：
- `FMaterialId.FNumber`（物料编码）、`FMaterialId.FName`（物料名称）
- `FStockId.FName`（仓库名称）、`FLot.FNumber`（批号）
- `FQty`（库存量/主单位）、`FBaseQty`（库存量/基本单位）
- `FAVBQty`（可用量/主单位）、`F_JR_FHTZDKYL1`（开单可用量）
- 弹性字段：`FAuxPropId.FF100001.FName`（色号名称）、`FAuxPropId.FF100002`（缸号）

**❌ 禁用字段**：
- `FNumber` → 正确写法：`FMaterialId.FNumber`
- `FAvailableQty` / `FAuxQty` → 不存在
- `FAuxPropId` / `FStockLocId` → 弹性父键，不可直接查询，触发 500

### 客户 BD_Customer

**✅ 已验证可用字段**：
- `FName`（客户名称）、`FNumber`（客户编号）
- `FCreateDate`（创建日期）、`FModifyDate`（最后修改日期）
- 自定义字段：`F_XX_KHSR`（客户生日）、`F_XX_KHSRYF`（生日月份）
- `FKHLB`（客户类别，返回ID）、`FFWZY`（服务专员，返回ID）

**❌ 禁用字段**：
- `FContact` / `FPhone` → 不存在，联系人在自定义字段中

---

## 关键避坑提醒

| 陷阱 | 说明 |
|------|------|
| `STK_OutStock` 当销售出库用 | 销售出库单是 `SAL_OUTSTOCK`，STK_OutStock 会报"业务对象不存在" |
| `FAllAmount` 直接求和 | FAllAmount 是**行级字段**，同一订单多行会重复，需按 FBillNo 去重 |
| `FCustomerID` / `FCustomerId` | 不存在，正确写法是 `FCustId` |
| `STK_Inventory` 中用 `FNumber` | 不存在，物料编号是 `FMaterialId.FNumber` |
| `STK_Inventory` 中用 `FAvailableQty` | 不存在；可用量是 `FAVBQty` |
| 弹性字段直接用父键查询 | `FAuxPropId` 和 `FStockLocId` 均为弹性父键，直接查询触发 500，必须展开到子字段 |
| `PUR_ReceiveBill` 查采购入库 | 返回空，应使用 `STK_InStock` |
| 查询不加 `top_count` | 可能返回数据过大超过限制 |

---

## 查询步骤优化（三步决策）

在构造查询前，先判断属于哪个步骤：

```
步骤① — 常见场景（销售订单、库存、客户等高频查询）
   → 直接套用下方「预置字段模板」，跳过 query_metadata，直接查询
   
步骤② — 已验证场景但需追加字段
   → 已有字段用模板，仅对追加字段调用 query_metadata 验证
   → 验证后用 top_count=1 小范围测试新字段
   
步骤③ — 全新的表单或不确定字段
   → 先调用 query_metadata(form_id) 了解全量字段
   → 从返回的 Key 中按 metadata 转换规则提取有效字段
   → 用 top_count=1 测试后扩大范围
```

---

## 预置字段模板（✂️ 可直接复制使用）

### 场景1 — 销售订单列表

```python
fields_sale_order = "FBillNo,FDate,FCustId.FName,FSalerId.FName,FAllAmount,FDocumentStatus"
# 注意：FDate 和 FCreateDate 选一个即可，不要两个都要
# FAllAmount 是行级字段，同一单号多行会重复
```

### 场景2 — 库存查询

```python
fields_inventory = "FMaterialId.FNumber,FMaterialId.FName,FStockId.FName,FQty,FAVBQty"
# STK_Inventory 是库存明细视图，不是物料档案
```

### 场景3 — 客户信息

```python
fields_customer = "FName,FNumber,FCreateDate,FKHLB,FFWZY"
# FKHLB（客户类别）和 FFWZY（服务专员）返回 ID，需映射到名称
```

### 场景4 — 销售出库单

```python
fields_outstock = "FBillNo,FDate,FStockId.FName,FCreatorId.FName,FDocumentStatus"
# 注意：SAL_OUTSTOCK 中不存在 FCustId.FName！
```

### 场景5 — 采购入库单

```python
fields_instock = "FBillNo,FDate,FDocumentStatus,FSupplierId.FName,FStockId.FName,FQty"
```

### 场景6 — 采购订单

```python
fields_purchase = "FBillNo,FDate,FDocumentStatus,FSupplierId.FName,FCreatorId.FName,FAmount"
```

### 场景7 — 供应商信息

```python
fields_supplier = "FNumber,FName,FDocumentStatus,FForbidStatus,F_HZLX,F_JR_JSFS"
```

---

## 常用操作速查

### 查询元数据（验证字段名）

```python
query_metadata(form_id="SAL_SaleOrder")
```

从返回结果中提取：`Key` = 可用字段名，`MustInput=1` = 必填字段，`IsViewVisible=false` = 已废弃/隐藏字段

> ⚠️ **重要**：元数据返回的 `Key`（如 `FAUXPROPID__FF100001`）不能直接用于查询！必须按 `field-rules.md` 中的 metadata 转换规则转换后才能使用。

### 查询列表

```python
query_bill_json(
    form_id="SAL_SaleOrder",
    field_keys="FBillNo,FDate,FCustId.FName,FDocumentStatus",
    filter_string="FDate >= '2026-03-01' AND FDate < '2026-03-02'",
    top_count=50,
    field_order="FDate"
)
```

### 全量自动翻页查询（v1.2.0+，推荐）

当数据量超过 2000 行时，使用 `query_bill_all` 自动翻页获取全部数据：

```python
query_bill_all(
    form_id="SAL_SaleOrder",
    field_keys="FBillNo,FDate,FCustId.FName,FAllAmount",
    filter_string="FDate >= '2026-01-01' AND FDate < '2026-07-01'",
    top_count=2000,
    field_order="FDate",
    pages=10              # 最多翻页数（可选，默认20）
)
```

> 返回合并后的完整数据列表，无需手动处理翻页逻辑。

### 日期分片查询（v1.2.0+，适合跨年/跨季度）

```python
query_bill_range(
    form_id="SAL_SaleOrder",
    field_keys="FBillNo,FDate,FAllAmount",
    filter_string="FDate >= '2025-01-01' AND FDate < '2026-01-01'",
    top_count=2000,
    slice_days=90            # 每片天数（可选，默认90）
)
```

### 大数据量导出到文件（v1.2.0+，万行以上）

```python
query_bill_to_file(
    form_id="SAL_SaleOrder",
    field_keys="FBillNo,FDate,FCustId.FName,FAllAmount,FDocumentStatus",
    filter_string="FDate >= '2025-01-01' AND FDate < '2026-01-01'",
    top_count=2000
)
```
> 返回文件路径，数据已写入本地文件，避免 tool-result 超限。

### 数据量预判（v1.1.0+）

```python
count_bill(
    form_id="SAL_SaleOrder",
    filter_string="FDate >= '2025-01-01' AND FDate < '2025-07-01'"
)
```
> 返回 `{"estimated_rows": N, "is_exact": true/false}`，用于决定使用哪种查询策略。

### 查看单据详情

```python
view_bill(form_id="SAL_SaleOrder", number="XSDD2602000001")
```

> `view_bill` 返回 Kingdee 标准嵌套包装。实际数据通常在 `Result.Result` 中，AI 调用时需注意解包。
> 如果返回 `{"status": "error", ...}` 说明视图出错；如果返回 `{"Result": {...}}` 说明是 Kingdee 标准包装，需取 `Result.Result` 作为实际数据。

### 查询参数最佳实践

```python
# ✅ 推荐做法
query_bill_json(
    ...
    field_order="FDate",                      # 按日期排序
    filter_string="... AND FDocumentStatus = 'C'",  # 只查已审核
)

# 推荐过滤条件：
# FDocumentStatus = 'C'  → 过滤暂存/草稿
# FCloseStatus           → 判断是否已关闭
# field_order="FDate"    → 结果按日期排序
```

---

## References 指引

查询具体模块时，**必须先查阅对应 reference 文件**确认字段名：

| 场景 | 参考文件 |
|------|---------|
| ⭐ **字段规则速查、元数据转换、零猜测约束** | `field-rules.md`（始终加载） |
| 查任意模块的已验证/禁用字段 | `references/verified-fields.md` |
| 生成经营日报 | `references/daily-report-workflow.md` |
| 查询客户信息、生日、类别 | `references/customer-query-guide.md` |
| 遇到 500 错误、数据量问题 | `references/common-errors.md` |
| 按客户/业务员/产品分析销售 | `references/sales-analysis-workflow.md` |
| 库存总览、预警、呆滞分析 | `references/inventory-analysis-workflow.md` |
| 订单全流程追踪、逾期预警 | `references/order-tracking-workflow.md` |
| 生成周报/月报、期间对比 | `references/periodic-report-workflow.md` |

> **重要**：`field-rules.md` 中的「第 0 条 — 禁止猜测字段名」是所有查询的最高优先级规则，请严格遵守。
