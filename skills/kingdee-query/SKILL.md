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
5. **单据状态口径（默认只看已审核）**：金蝶默认返回多种状态（含未审核的B/草稿）。**特定业务统计场景（业绩统计、经营日报、销售分析、金额汇总）必须默认只取已审核数据**，过滤加 `FDocumentStatus = 'C'`。除非用户明确要求包含未审核/草稿单，否则不得混入。查询列表时按需展示状态字段
6. **金额口径（默认含税）**：凡是涉及金额的字段，默认取含税金额。销售订单金额字段用 `FAllAmount`（含税合计，行级，统计需按 FBillNo 去重）
7. **控制数据量**：`top_count` 限制行数，只查必要字段，超过20行数据考虑创建 Excel
8. **字段不确定时**：先调用 `query_metadata(form_id)` 验证字段是否存在，避免试错
9. **优先使用高阶查询工具**（v1.2.0+）：`count_bill` 预判数据量 → `query_bill_all` 自动翻页全量查询 → `query_bill_to_file` 万行以上导出到文件

### 🎯 查询准确性纪律（mandatory，2026-09-03 总纲）

> 适用所有数据量。准确性由「机制」而非「仔细」保证。

1. **真实性由接口+截断防护保证**：金蝶 TCP 返回什么就是什么，无"记错/心算错"。唯一出错源是 MCP 截断（>1MB 静默截断）与漏页，已被「落盘 + 行数比对 + exhausted=true + 边界抽查」拦截。数据多少皆如此。
2. **禁止"人工目检/肉眼核对"措辞与实践**：准确表述为「程序化校验 + 金蝶 view_bill 反查交叉验证」。人工心算/肉眼归总是出错根源，一律脚本聚合。
3. **数据量小的校验**：≤2000行通常单页 exhausted=true，MCP 截断天然规避；仍须行数比对 count_bill，并对关键单/客户做 view_bill 反查，可全量程序化校验。
4. **数据量大的校验**：>2000行禁裸查，≥万行强制 query_bill_to_file 落盘，跨月跨年 query_bill_range 分片，交付前三重校验。

### 📊 产品线/金额分析强制纪律（mandatory，2026-08-28 固化）

> **背景**：曾因"凭印象编造产品线分布表"导致金额误差数百万。以下为强制规则，违反即错。

1. **必落盘再聚合**：涉及产品线/客户/业务员 × 金额的分析，**必须先 `query_bill_to_file` 将明细落盘到本地**，再用脚本逐行聚合。**禁止**凭印象、凭知识库分类直接输出分布表。
2. **三重校验（交付前必做）**：① 落盘行数 == count_bill 预估；② 全部 `FDocumentStatus='C'`；③ 金额口径用 `FAllAmount`（含税）。
3. **归类用金蝶真实字段**：产品线 = 物料 `FMaterialId.FDescription`（每笔直接挂好），**不得自行脑补归类**；不确定就查实际字段。
4. **大线抽查**：任一产品线占比 >20% 时，必须展开明细抽查，确认是否由单一大单撑起、是否归对线。
5. **对角检查**：各产品线金额之和必须等于销售总额，对不上 = 有漏，需重查。

### 📌 必展示字段口径（mandatory，查询与分析都要遵循）

> 以下字段**只要数据里有，必须展示**，不可省略；做**统计/数据分析**时，必须围绕这四个核心字段展开维度。

| 分析维度 | 金蝶字段 | 说明 |
|---------|---------|------|
| **产品线/品牌** | `FMaterialId.FDescription`（描述） | 产品线归属，如 兆正工控、揽盛电气·冷源、盛位电子 |
| **规格型号** | `FMaterialId.FSpecification` | 精确型号，如 ZZC5-350/3P、LSY1-45FD64J |
| **物料名称** | `FMaterialId.FName` | 品类，如 交流接触器、终端冷源、读卡器 |
| **客户** | `FCustomerId.FName` / `FCustomerId.FNumber` | 客户名称 + 客户编码 |

- **查询涉及物料时**：必带 物料名称 `FName` + 规格型号 `FSpecification` + 描述/产品线 `FDescription`（三要素不可省）
- **查询涉及客户时**：必带 客户名称 `FName` + 客户编码 `FNumber`
- **统计/数据分析**（业绩、销售分析、报表）维度：客户、描述（产品线）、规格型号、物料名称四者必须纳入分析
- **产品线/品牌 = 描述字段** `FMaterialId.FDescription`

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

## ⚠️ 大数据量防错防漏规范（mandatory）

> **目标**：承诺「零出错、零遗漏」。无论查询多大的数据量，都必须全程执行本规范。
> **根因**：金蝶单次 API 上限约 2000 行；MCP tool-result 上限 1MB。超过任一上限时会**静默截断**（不报错但数据不全）——这是数据遗漏的最大隐患。

### 核心决策门槛

- **预计行数 > 2000 或可能超 1MB** → 禁止使用 `query_bill_json` 裸查（必被截断）
- **预计行数 ≥ 10000（万行级）** → **强制**使用 `query_bill_to_file` 流式落盘，不以内存返回
- **跨月/跨季度/跨年** → **强制**使用 `query_bill_range` 按 `month` 分片 + 自动翻页

### 四段式执行流程

```
① count_bill 预估 → ② 分片/落盘采集 → ③ 三重校验 → ④ 交付留痕
```

### ✅ 三重校验（交付前必做，防漏核心）

**校验① 行数比对（硬指标）**
```
最终 row_count（或各分片之和） == count_bill 预估数
```
- 相等 → 通过；不等 → 定位差异分片，补查或排查

**校验② exhausted 标志（硬指标）**
- 所有查询必须返回 `exhausted:true`（已全部拉完）
- 出现 `false` → 继续翻页，直到拉满，不得提前交付

**校验③ 边界抽查（软校验）**
- 抽查**首尾日期**、**关键单据编号**、**极大/极小金额**记录是否存在
- 核对**汇总金额/客户数/产品线数**是否数量级合理

### 七步执行清单（每次大数据查询必走）

```
□ Step1  count_bill 预估数据量并记录预估值
□ Step2  按规模选择工具（万级→ query_bill_to_file；跨年→ query_bill_range）
□ Step3  采集：分片(month) + 翻页 + 落盘，字段精简只取必要项
□ Step4  校验① 行数 == 预估
□ Step5  校验② exhausted == true（全部分片）
□ Step6  校验③ 边界抽查 + 汇总金额合理性
□ Step7  通过→交付；不通过→定位补查，禁止带漏交付
```

### 防漏差异化注意点

- **同一订单多行金额（如 `FAllAmount`）** → 统计金额需按 `FBillNo` 去重，避免重复计数
- **单据状态** → 业务统计默认 `FDocumentStatus='C'`（已审核），除非用户另有要求
- **产品线归属** → 用 `FMaterialId.FDescription`
- **日期口径** → 明确用 `FDate`（业务日期）还是 `FCreateDate`（创建时间）

### 校验后验证示例

```json
// 期望输出形态
{"row_count": 10035, "exhausted": true, "chunks": 8}
// 校验：10035 == count_bill 预估值；exhausted=true；首尾日期齐全 → 通过
```

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

**✅ 已验证可用字段**（2026-09-02 实测）：
- `FBillNo`、`FDate`、`FCreateDate`（出库单过滤推荐字段）、`FDocumentStatus`
- `FCustomerID.FName`（**客户**：出库单的客户字段是这个，不是 FCustId）
- `FSalesManID.FName`（销售员/业务员）、`FSaleDeptID.FName`（销售部门）
- `FCreatorId.FName`（开单人）、`FStockId.FName`（仓库）
- 行级：`FMaterialId.FName/FSpecification`、`FQty`、`FRealQty`、`FAllAmount`（可直接顶层查询）

**❌ 禁用字段**：
- `FCustId.FName`、`FSalerId.FName` → 在 SAL_OUTSTOCK 中**不存在**（会报 500）
- 客户请用 `FCustomerID.FName`；销售员请用 `FSalesManID.FName`

**⚠️ 口径硬规则**：
- 用户要"出库/发货数据"→ 必须查 `SAL_OUTSTOCK`；"退货数据"→ 查 `SAL_RETURNSTOCK`
- **禁止**用销售订单 `SAL_SaleOrder` 充当出库/发货口径（订单≠已发货，金额/客户口径不同）

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
fields_outstock = "FBillNo,FDate,FCustomerID.FName,FSalesManID.FName,FStockId.FName,FMaterialId.FName,FRealQty,FAllAmount,FDocumentStatus"
# 出库单客户字段是 FCustomerID.FName（不是 FCustId）；销售员是 FSalesManID.FName
# 出库/发货数据必须查 SAL_OUTSTOCK，不要用销售订单代替
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
    order_string="FDate ASC"
)
```

### 全量自动翻页查询（v1.2.0+，推荐）

当数据量超过 2000 行时，使用 `query_bill_all` 自动翻页获取全部数据：

```python
query_bill_all(
    form_id="SAL_SaleOrder",
    field_keys="FBillNo,FDate,FCustId.FName,FAllAmount",
    filter_string="FDate >= '2026-01-01' AND FDate < '2026-07-01'",
    order_string="FDate ASC",
    page_size=2000,           # 每页行数（默认2000，建议不超过2000）
    max_rows=10000            # 最多返回行数（安全上限，默认20000）
)
```

> 返回合并后的完整数据列表，无需手动处理翻页逻辑。

### 日期分片查询（v1.2.0+，适合跨年/跨季度）

```python
query_bill_range(
    form_id="SAL_SaleOrder",
    field_keys="FBillNo,FDate,FAllAmount",
    date_field="FDate",
    date_from="2025-01-01",
    date_to="2026-01-01",
    extra_filter="FDocumentStatus = 'C'",   # 附加过滤（可选）
    chunk="month",                          # 按片切分：month/quarter/year（默认month）
    output_path=""                          # 空则内联返回；非空（如 "/tmp/sales.ndjson"）则流式落盘
)
```

### 大数据量导出到文件（v1.2.0+，万行以上）

```python
query_bill_to_file(
    form_id="SAL_SaleOrder",
    field_keys="FBillNo,FDate,FCustId.FName,FAllAmount,FDocumentStatus",
    filter_string="FDate >= '2025-01-01' AND FDate < '2026-01-01'",
    output_path="/tmp/sales_2025.ndjson",   # 输出文件绝对路径（必填）
    page_size=2000
)
```
> 返回文件路径，数据已流式写入本地文件，避免 tool-result 超限。

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
    order_string="FDate ASC",                 # 按日期排序
    filter_string="... AND FDocumentStatus = 'C'",  # 只查已审核
)

# 推荐过滤条件：
# FDocumentStatus = 'C'  → 过滤暂存/草稿
# FCloseStatus           → 判断是否已关闭
# order_string="FDate ASC"  → 结果按日期排序
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
| 查询总账凭证、借贷分录 | `references/gl-voucher-guide.md` |
| 适配本系统字段/ID映射/单号规律 | `references/customization-guide.md` |

> **重要**：`field-rules.md` 中的「第 0 条 — 禁止猜测字段名」是所有查询的最高优先级规则，请严格遵守。
