# 经营日报工作流

生成完整经营日报的最优token路径，按以下顺序执行**5次查询**即可完成，无需试错。

---

## 标准5步查询

### Step 1 — 销售订单（含金额和客户名）

```python
query_bill_json(
    form_id="SAL_SaleOrder",
    field_keys="FBillNo,FDate,FDocumentStatus,FAllAmount,FCustId.FName",
    filter_string="FDate >= 'TODAY' AND FDate < 'TOMORROW'",
    top_count=100
)
```

> 说明：将`TODAY`/`TOMORROW`替换为实际日期，如`'2026-03-02'`/`'2026-03-03'`
> 注意：`FAllAmount`是行级字段，同一`FBillNo`多行会重复。统计订单总额时需按`FBillNo`分组去重后求和。

### Step 2 — 销售出库单（含开单人和仓库）

```python
query_bill_json(
    form_id="SAL_OUTSTOCK",
    field_keys="FBillNo,FCreateDate,FDocumentStatus,FCreatorId.FName,FStockId.FName",
    filter_string="FCreateDate >= 'TODAY' AND FCreateDate < 'TOMORROW'",
    top_count=200
)
```

> 说明：出库单推荐用`FCreateDate`过滤，比`FDate`更准确反映今日实际开单情况。

### Step 3 — 采购入库单

```python
query_bill_json(
    form_id="STK_InStock",
    field_keys="FBillNo,FDate,FDocumentStatus",
    filter_string="FDate >= 'TODAY' AND FDate < 'TOMORROW'",
    top_count=200
)
```

### Step 4 — 待审核采购订单（不限日期，查所有积压）

```python
query_bill_json(
    form_id="PUR_PurchaseOrder",
    field_keys="FBillNo,FDate,FDocumentStatus",
    filter_string="FDocumentStatus = 'B'",
    top_count=50
)
```

### Step 5 — 库存预警（零库存或低库存）

```python
query_bill_json(
    form_id="STK_Inventory",
    field_keys="FMaterialId.FNumber,FMaterialId.FName,FBaseQty,FStockId.FName",
    filter_string="FBaseQty < 50",
    top_count=100
)
```

> 说明：阈值`50`可根据实际业务调整；查零库存可改为`FBaseQty = 0`。

---

## 可选追加查询

### 1. 待审核销售订单（在Step1后追加）

```python
query_bill_json(
    form_id="SAL_SaleOrder",
    field_keys="FBillNo,FDate,FDocumentStatus,FCustId.FName",
    filter_string="FDocumentStatus = 'B'",
    top_count=50
)
```

### 2. 按开单人统计出库量

```python
query_bill_json(
    form_id="SAL_OUTSTOCK",
    field_keys="FBillNo,FCreateDate,FCreatorId.FName",
    filter_string="FCreateDate >= 'TODAY' AND FCreateDate < 'TOMORROW'",
    top_count=200
)
```

---

## FAllAmount去重处理方法

销售订单的`FAllAmount`是行级字段，直接求和会导致金额翻倍，需按以下逻辑处理：

1. 查询返回数据后，按`FBillNo`分组
2. 每组内对`FAllAmount`求和 = 该订单的含税总金额
3. 再对所有订单总额求和 = 当日销售总额

示例伪代码：

```python
orders = {}
for row in result:
    bill_no = row["FBillNo"]
    if bill_no not in orders:
        orders[bill_no] = {"customer": row["FCustId.FName"], "amount": 0}
    orders[bill_no]["amount"] += row["FAllAmount"]
total = sum(o["amount"] for o in orders.values())
```

---

## 日报排除规则

- **内部采购单**：如系统中有内部调拨/自购客户，金额通常为0，做经营统计时建议排除
- 可在`filter_string`中追加：`AND FCustId.FName not like '%内部客户关键词%'`（需替换为实际的内部客户名称特征）

---

## 推荐输出格式

### 1. 简要版（文本）

```
📊 今日经营日报（2026-03-02）
【销售订单】新增 12 笔，金额合计 ¥158,000
【销售出库】出库 28 笔
【采购入库】入库 5 笔
【待审核】采购订单 3 笔待审
【库存预警】零库存物料 2 项
```

### 2. 详细版（表格）

对每个模块使用Markdown表格展示，超过10行数据建议创建Excel文件输出。
