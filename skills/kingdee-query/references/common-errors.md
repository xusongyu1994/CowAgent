# 常见错误及解决方案

## 错误1: 元数据中标识为 XXX 的字段不存在（500）

**错误信息：**

```json
{"ErrorCode": 500, "Message": "元数据中标识为FCustomerID的字段不存在"}
```

**原因：** 字段名拼写错误、大小写错误或该表中不存在此字段

**解决方案：**

1. **从错误消息中提取错字段名**：`标识为XXX` 中的 `XXX` 就是出错的字段，记下来
2. 查阅 `verified-fields.md` 确认正确字段名
3. 查阅 `field-rules.md` 中的 metadata 转换规则（如果是 `__` 双下划线格式）
4. 确保大小写正确（金蝶字段以 F 开头，驼峰命名）
5. 关联字段必须加 `.FName` 或 `.FNumber` 后缀

> **不要盲目重试整条查询！** 如果 `field_keys` 中有多个可疑字段（比如 `A, 错误1, C, 错误2, E` 共 5 个字段），  
> **建议策略**：先用只有 1 个字段 `top_count=1` 测试每个可疑字段，**确认正确再逐一添加**。

### 逐字段修复策略

如果 `field_keys` 中有 **多个错字段**，不要逐个盲目重试，按以下策略减少 API 调用：

```python
# ❌ 错误做法：5个字段中有2个错的，反复整条重试
# 第1次: field_keys="A,错1,C,错2,E" → 500(错1)
# 第2次: field_keys="A,对1,C,错2,E" → 500(错2)  # ← 又报错
# 第3次: field_keys="A,对1,C,对2,E" → 成功        # 3次API

# ✅ 推荐做法：先只用1个字段测试每个可疑字段
# 第1次: field_keys="错1" top_count=1 → 500       # 确认错1
# 第2次: field_keys="错2" top_count=1 → 500       # 确认错2
# 替换正确的字段名 →
# 第3次: field_keys="A,对1,C,对2,E" → 成功        # 也是3次，但更可控
```

**核心原则**：确认一个字段正确后，后续重试不再怀疑它。只在出错字段位置替换，不要整体重写查询。

**高频错误字段汇总：**

| 错误写法 | 正确写法 | 所属表 |
|---------|---------|-------|
| `FCustomerID` / `FCustomerId` | `FCustId.FName` | SAL_SaleOrder |
| `FSaleAmount` / `FTotalAmount` | `FAllAmount`（行级） | SAL_SaleOrder |
| `FApproveStatus` | `FDocumentStatus` | 所有单据 |
| `FNumber`（库存表中） | `FMaterialId.FNumber` | STK_Inventory |
| `FStockQty` | `FBaseQty` | STK_Inventory |
| `FMinStockQty` / `FLowStockQty` | 不存在，需手动设阈值 | STK_Inventory |
| `FCustId.FName`（出库单中） | 不存在，客户请用 `FCustomerID.FName` | SAL_OUTSTOCK |
| `FAllQty`（出库单中） | 不存在 | SAL_OUTSTOCK |
| `FContact` / `FPhone` | 不存在，联系人/电话在自定义字段中（用 query_metadata 确认） | BD_Customer |
| `FIsArchive` / `FSaleOrgId` / `FID` | 不存在 | BD_Customer |

---

## 错误2: 业务对象不存在（500）

**错误信息：**

```json
{"ErrorCode": 500, "Message": "业务对象不存在"}
```

**原因：** 表单ID 错误

**常见错误对照：**

| 业务场景 | 错误ID | 正确ID |
|---------|--------|--------|
| 销售出库单 | `STK_OutStock` | `SAL_OUTSTOCK` |
| 采购入库 | `PUR_ReceiveBill`（返回空） | `STK_InStock` |

---

## 错误3: 会话信息已丢失，请重新登录

**错误信息：**

```json
{"ErrorCode": 500, "Message": "会话信息已丢失，请重新登录"}
```

**原因：** MCP 服务器的登录 token 过期或网络中断

**解决方案：**

1. 自动恢复（v1.3.2+）：MCP Server 内置了 `RetryableK3CloudApiSdk` 自动重连机制，会话过期后会尝试自动重新登录并重试请求，**无需手动干预**
2. 如果自动恢复失败，告知用户稍后重试，或联系管理员重启 MCP 服务
3. 预防：MCP 服务器端已实现 token 刷新机制，长时间运行时会自动维护会话

---

## 错误4: 数据量过大（超过 1MB）

**错误信息：**

```
Tool result is too large. Maximum size is 1MB.
```

**解决方案：**

### 方案1 — 减少字段

```python
# 精简到必要字段
field_keys: "FBillNo,FDate,FCustId.FName,FAmount"
```

### 方案2 — 检查截断标志并翻页

`query_bill_json` / `query_bill` 的返回结果现在带有分页元数据：

```json
{
  "rows": [...],
  "row_count": 2000,
  "truncated": true,
  "next_start_row": 2000,
  "hint": "返回行数已达上限..."
}
```

翻页模板（旧方案，手动循环）：

```python
start = 0
all_rows = []
while True:
    result = query_bill_json(..., top_count=2000, start_row=start)
    all_rows.extend(result["rows"])
    if not result["truncated"]:
        break
    start = result["next_start_row"]
```

### 方案3（v1.2.0+，推荐）— 使用 query_bill_all 自动翻页

```python
# 自动处理所有翻页逻辑，返回全部数据
query_bill_all(
    form_id="SAL_SaleOrder",
    field_keys="FBillNo,FDate,FCustId.FName,FAmount",
    filter_string="FDate >= '2025-01-01' AND FDate < '2025-06-01'",
    page_size=2000,   # 每页行数（默认2000）
    max_rows=10000    # 最多返回行数（安全上限，默认20000）
)
```

### 方案4（v1.2.0+，跨月/跨年）— 使用 query_bill_range 日期分片

```python
# 按日期分片自动查询，适合跨季度/跨年
query_bill_range(
    form_id="SAL_SaleOrder",
    field_keys="FBillNo,FDate,FCustId.FName,FAmount",
    date_field="FDate",
    date_from="2025-01-01",
    date_to="2026-01-01",
    extra_filter="FDocumentStatus = 'C'",   # 附加过滤（可选）
    chunk="month",                          # month/quarter/year（默认month）
    output_path=""                          # 空则内联返回；非空则流式落盘
)
```

### 方案5（v1.2.0+，万行以上）— 使用 query_bill_to_file 导出到文件

```python
# 流式导出到文件，避免 tool-result 超限
query_bill_to_file(
    form_id="SAL_SaleOrder",
    field_keys="FBillNo,FDate,FCustId.FName,FAmount",
    filter_string="FDate >= '2025-01-01' AND FDate < '2025-12-31'",
    output_path="/tmp/orders.ndjson",  # 输出文件绝对路径（必填）
    page_size=2000
)
# 返回文件路径，数据已写入本地文件
```

### 方案6 — 分步查询

```python
# 先查编号列表
field_keys: "FBillNo,FDate"
# 再逐个查详情
view_bill(form_id=..., number=...)
```

---

## 错误5: 单据状态不允许此操作

**错误信息：**

```json
{"Message": "单据已审核，不允许修改"}
```

**原因：** 单据状态不符合操作要求

**状态流转规则：**

```
暂存(A) → 提交(B) → 审核(C)
```

**解决方案：**

- 修改已审核单据：先 `unaudit_bill` 反审核，再修改
- 审核未提交单据：先 `submit_bill` 提交，再 `audit_bill` 审核
- 操作前先查 `FDocumentStatus` 确认当前状态

---

## 错误6: 必录字段未填写

**错误信息：**

```json
{"Message": "字段[客户]是必录字段"}
```

**常见必填字段：**

| 单据类型 | 必填字段 |
|---------|---------|
| 销售订单 | 单据类型(FBillTypeID)、销售组织(FSaleOrgId)、客户(FCustId)、日期(FDate) |
| 明细行 | 物料(FMaterialId)、数量(FQty)、单价(FPrice) |

**解决方案：** 通过 `view_bill` 查看同类型已有单据，参考其数据结构填写必填项。

---

## 错误7: 权限不足 / 结果异常为空

MCP Server 不实现数据权限，所有查询都以配置的集成用户（`KD_USERNAME`）身份执行，能看到什么数据完全由该用户在金蝶云星空中的权限决定。权限问题有两种表现，**必须分开判断**：

### 表现1：显式报错（功能权限不足）

```json
{"ErrorCode": 500, "Message": "您没有该功能的操作权限"}
```

容易识别，按信息提示用户联系管理员为集成用户补齐对应表单/操作权限即可。

### 表现2：静默过滤（数据权限限制），不报错

- `count_bill` / `query_bill*` 正常返回，但行数比预期少，甚至为 0
- 这是金蝶数据规则（按组织/部门/业务员等过滤）在生效，**服务端不会返回任何错误提示**

> ⚠️ **对 LLM 的重要提示：查询结果为空或行数明显偏少时，不要直接向用户断言"该时间段无单据"或"无相关数据"。**
> 应先说明这也可能是集成用户的数据权限限制导致，并建议用户用同一账号登录金蝶云星空 Web 端执行相同条件查询，对比行数以确认是否为权限过滤（而非真实无数据）。
>
> 本项目另有**用户级金蝶权限拦截**（`build_kingdee_form_filter`）：在 Web handler 与 Agent 拦截点统一按当前用户身份注入过滤条件，无表单权限时直接拒绝。即使有权限拦截，集成用户的星空侧数据权限仍可能进一步静默过滤，两套机制都需要考虑。

---

## "查询出错" vs "查不到数据" — 不要混淆！

| 返回结果 | 含义 | 下一步 |
|---------|------|--------|
| `{"rows": [], "row_count": 0}` 或 `[]` | ✅ **查询成功，没有匹配记录** | 告诉用户"没有找到符合条件的数据"，建议放宽时间范围或调整过滤条件。**不要重试！** |
| `{"ErrorCode": 500, "Message": "元数据中标识为..."}` | ❌ **字段名错了** | 从 `Message` 提取错字段名，查 verified-fields.md 修复 |
| `{"ErrorCode": 500, "Message": "业务对象不存在"}` | ❌ **表单ID错了** | 查 SKILL.md 表单速查表确认正确 ID |
| `{"ErrorCode": 500, "Message": "会话信息已丢失..."}` | ❌ **会话过期** | 重试即可（v1.3.2+ 自动恢复） |
| 返回数据但都是 `null` 值 | ❌ **字段存在但权限不足** | 去掉这些字段或用 `query_metadata` 确认字段可见性 |

**关键提醒：** 看到 `rows=[]` 或 `row_count=0` 时，查询是成功的，**不需要修复任何东西**。直接告诉用户结果即可。

---

## 大数据量查询推荐工具顺序

当数据量较大时，按以下优先顺序选择工具：

| 优先级 | 工具 | 适用场景 |
|--------|------|---------|
| ① | `query_bill_all`（v1.2.0+） | 自动翻页，适合单次全量。**首选** |
| ② | `query_bill_range`（v1.2.0+） | 日期分片，适合跨季度/跨年。**次选** |
| ③ | `query_bill_to_file`（v1.2.0+） | 流式导出到文件，适合万行以上 |
| ④ | 手动翻页 `query_bill_json` + `start_row` | 旧方案，仅当前三者不可用时使用 |

---

## 故障排查清单

遇到问题时按以下顺序检查：

1. ✅ **表单ID 是否正确？** → 查 SKILL.md 表单速查表
2. ✅ **字段名是否正确？** → 查 verified-fields.md 或 field-rules.md，注意大小写和 `.FName` 后缀
3. ✅ **500 错误中的字段名已提取？** → 从 `标识为XXX` 中提取错字段，按 field-rules.md 转换规则修复
4. ✅ **数据量是否过大？** → 减少字段 / 使用 query_bill_all 自动翻页 / 使用 query_bill_to_file 导出到文件
5. ✅ **会话是否过期？** → v1.3.2+ 支持自动恢复，重试即可
6. ✅ **单据状态是否正确？** → 检查 FDocumentStatus，按流程操作
7. ✅ **必填字段是否完整？** → 参考已有单据的数据结构
8. ✅ **结果为空是否因数据权限？** → 用同一集成用户账号登录金蝶云星空 Web 端比对行数，不要直接断言无数据
