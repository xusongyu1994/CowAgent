# 已验证字段列表

所有字段均经过实际测试验证：

- 标记 ✅ 的可直接使用
- 标记 ❌ 的会触发500错误，**禁止使用**
- 字段不确定时：调用 `query_metadata(form_id)` 实时验证。返回结果中 `Key` = 可用字段名，`MustInput=1` = 必填，`IsViewVisible=false` = 已废弃/隐藏，`Extends` = 枚举合法值
- 本文件记录的是已验证的常用字段子集，不是全量字段

---

## 目录

1. 销售订单 SAL_SaleOrder
2. 销售订单明细字段（表体）
3. 销售出库单 SAL_OUTSTOCK
4. 采购入库单 STK_InStock
5. 采购订单 PUR_PurchaseOrder
6. 库存查询 STK_Inventory
7. 客户 BD_Customer
8. 物料 BD_MATERIAL
9. 供应商 BD_Supplier

---

## 一、销售订单 SAL_SaleOrder

> ⚠️ 以下规则仅适用于 SAL_SaleOrder（销售订单）

### ✅ 已验证可用字段

| 字段名 | 含义 | 备注 |
|--------|------|------|
| `FBillNo` | 单据编号 | 格式取决于部署配置，如 `XSDD2602000001` |
| `FDate` | 单据日期 | 业务日期，手填 |
| `FCreateDate` | 创建时间 | 系统自动，精确到毫秒 |
| `FDocumentStatus` | 单据状态 | Z=暂存, A=创建, B=审核中, C=已审核, D=重新审核 |
| `FAllAmount` | 含税合计 | ⚠️ **行级字段**，同一单号多行会重复 |
| `FAmount` | 未税金额 | 表头级 |
| `FTaxAmount` | 税额 | 表头级 |
| `FCustId.FName` | 客户名称 | 关联字段 |
| `FCustId.FNumber` | 客户编号 | 关联字段 |
| `FSalerId.FName` | 业务员名称 | 关联字段 |
| `FSaleDeptId.FName` | 销售部门 | 关联字段 |
| `FSaleOrgId.FName` | 销售组织 | 关联字段 |
| `FLocalCurrId.FName` | 本位币 |  |
| `FCreatorId.FName` | 创建人 |  |
| `FApproverId.FName` | 审核人 |  |
| `FApproveDate` | 审核日期 |  |

### ❌ 禁用字段（会触发 500）

| 错误字段名 | 正确替代 |
|-----------|---------|
| `FCustomerID` | `FCustId.FName` 或 `FCustId.FNumber` |
| `FCustomerId` | 同上（大小写也不对） |
| `FSaleAmount` | `FAllAmount`（行级）或 `FAmount`（表头） |
| `FApproveStatus` | `FDocumentStatus` |
| `FSaleOrderEntry` | 非字段名，明细通过行级重复记录体现 |
| `FTotalAmount` | 不存在，需按 FBillNo 分组自行汇总 |

### ⚠️ FAllAmount 重要说明

`FAllAmount` 是行级字段：同一订单有多行商品时，每行都会返回该行的金额。查询结果中同一 FBillNo 会出现多条记录。

**正确做法：** 按 FBillNo 分组，对同一单号的行金额求和得到订单总额，而非直接将所有行金额相加。

---

## 二、销售订单明细字段（表体）

> ⚠️ 以下规则仅适用于 SAL_SaleOrder（销售订单）表体行级字段

以下字段在 `query_bill_json` 中直接使用，返回行级展开数据：

| 字段名 | 含义 | 备注 |
|--------|------|------|
| `FSeq` | 行号 |  |
| `FMaterialId.FNumber` | 物料编码 |  |
| `FMaterialId.FName` | 物料名称 |  |
| `FMaterialId.FSpecification` | 规格型号 |  |
| `FQty` | 数量 |  |
| `FUnitId.FName` | 计量单位 |  |
| `FPrice` | 未税单价 |  |
| `FTaxPrice` | 含税单价 |  |
| `FAmount` | 行未税金额 |  |
| `FTaxAmount` | 行税额 |  |
| `FAllAmount` | 行含税金额 |  |
| `FLot.FNumber` | 批次号 |  |
| `FStockId.FName` | 仓库名称 |  |
| `FStockLocId.FNumber` | 库位编码 |  |
| `FDeliveryDate` | 交货日期 |  |

---

## 三、销售出库单 SAL_OUTSTOCK

> ⚠️ 以下规则仅适用于 SAL_OUTSTOCK（销售出库单）
> ⚠️ 表单ID 是 `SAL_OUTSTOCK`，**不是** `STK_OutStock`（后者会报"业务对象不存在"）

### ✅ 已验证可用字段

| 字段名 | 含义 | 备注 |
|--------|------|------|
| `FBillNo` | 出库单编号 | 格式取决于部署配置 |
| `FDate` | 出库单据日期 | 手填日期 |
| `FCreateDate` | 系统创建时间 | 精确到毫秒，反映真实开单时间 |
| `FDocumentStatus` | 状态 | A/B/C |
| `FCreatorId.FName` | 开单人姓名 | 关联字段 |
| `FStockId.FName` | 仓库名称 | 关联字段 |

### ❌ 禁用字段

| 错误字段名 | 说明 |
|-----------|------|
| `FAllQty` | 不存在，出库总数量不在表头层 |
| `FCustId.FName` | 在 SAL_OUTSTOCK 中**不存在**，客户信息需从关联销售订单获取 |

### ⚠️ FDate 与 FCreateDate 差异

- `FDate` 过滤"今天"可能**遗漏**部分单据（单据日期填昨天但今天才创建）
- `FCreateDate` 更完整，反映真实的今日开单情况
- **推荐**：按开单人/工作量统计时优先使用 `FCreateDate`

---

## 四、采购入库单 STK_InStock

> ⚠️ 以下规则仅适用于 STK_InStock（采购入库单）
> ✅ 表单ID `STK_InStock` 正确。注意：`PUR_ReceiveBill`（采购收货单）测试返回空。

### ✅ 已验证可用字段

| 字段名 | 含义 | 备注 |
|--------|------|------|
| `FBillNo` | 入库单编号 | |
| `FDate` | 入库日期 | |
| `FDocumentStatus` | 状态 | A/B/C |
| `FSupplierId.FName` | 供应商名称 | 关联字段 |
| `FSupplierId.FNumber` | 供应商编号 | 关联字段 |
| `FStockId.FName` | 仓库名称 | 关联字段 |
| `FCreatorId.FName` | 创建人 | 关联字段 |
| `FApproverId.FName` | 审核人 | 关联字段 |
| `FApproveDate` | 审核日期 | |
| `FQty` | 数量（主单位） | 行级 |

### ❌ 禁用字段

| 错误字段名 | 说明 |
|-----------|------|
| `FAllQty` | 不存在 |

---

## 五、采购订单 PUR_PurchaseOrder

> ⚠️ 以下规则仅适用于 PUR_PurchaseOrder（采购订单）

### ✅ 已验证可用字段

| 字段名 | 含义 | 备注 |
|--------|------|------|
| `FBillNo` | 采购订单编号 | |
| `FDate` | 单据日期 | |
| `FDocumentStatus` | 状态 | Z/A/B/C/D |
| `FSupplierId.FName` | 供应商名称 | 关联字段 |
| `FSupplierId.FNumber` | 供应商编号 | 关联字段 |
| `FCreatorId.FName` | 创建人 | 关联字段 |
| `FAmount` | 未税金额 | 表头级 |
| `FTaxAmount` | 税额 | 表头级 |
| `FAllAmount` | 含税合计 | ⚠️ 行级字段 |

### ❌ 禁用字段

| 错误字段名 | 说明 |
|-----------|------|
| `FTotalAmount` | 不存在 |

---

## 六、库存查询 STK_Inventory

> ⚠️ 以下规则仅适用于 STK_Inventory（即时库存明细视图）
> ⚠️ `STK_Inventory` 是**库存明细视图**，不是物料档案。字段与 `BD_MATERIAL` 完全不同。

### ✅ 已验证可用字段

| 字段名 | 含义 | 备注 |
|--------|------|------|
| `FMaterialId.FNumber` | 物料编码 | 关联字段 |
| `FMaterialId.FName` | 物料名称 | 关联字段 |
| `FStockId.FName` | 仓库名称 | 关联字段 |
| `FLot.FNumber` | 批号 | 关联批次档案（BD_BatchMainFile） |
| `FQty` | 库存量（主单位） | ⚠️ 与 `FBaseQty` 不同，见下方说明 |
| `FBaseQty` | 库存量（基本单位） | 与主单位不一定相同，取决于换算率 |
| `FAVBQty` | 可用量（主单位） | ⚠️ 实测返回 0，与界面显示值不符，原因待查。暂不建议依赖此字段 |
| `FBaseAVBQty` | 可用量（基本单位） | `IsViewVisible=false`，界面不显示 |
| `FStockOrgId.FName` | 库存组织 | 关联字段 |
| `FBaseUnitId.FName` | 基本单位 | 关联字段 |
| `FProduceDate` | 生产日期 | 即时库存中最接近"入库日期"的字段 |
| `FExpiryDate` | 有效期至 |  |
| `FExpiryDays` | 到期天数 |  |
| `FStockStatusId.FName` | 库存状态 | 关联字段 |
| `FMtoNo` | 计划跟踪号 |  |
| `FAuxPropId.FF100001.FName` | 色号名称（辅助属性） | 弹性子字段，返回色号名称如 `8525,桃粉` |
| `FAuxPropId.FF100001.FNumber` | 色号编码（辅助属性） | 弹性子字段，返回色号编码如 `SH002143` |
| `FAuxPropId.FF100002` | 缸号（辅助属性） | 弹性子字段，文本类型，直接返回缸号字符串如 `QH260414` |
| `FStockLocId.FF100004.FName` | 少云纱线仓位名称 | 弹性子字段，返回仓位名称如 `A-2-14` |
| `FStockLocId.FF100004.FNumber` | 少云纱线仓位编码 | 弹性子字段，返回编码如 `A-2-14` |
| `F_JR_FHTZDKYL1` | 开单可用量 | 自定义字段（`IsViewVisible=true`），界面可见版本 |
| `F_JR_FHTZQTY1` | 开单未发货数量 | 自定义字段（`IsViewVisible=true`），界面可见版本 |

### ⚠️ FQty 与 FBaseQty 的区别

- `FQty`（库存量/主单位）= 界面"库存量（主单位）"列
- `FBaseQty`（库存量/基本单位）= 按基本计量单位计的数量
- 实际查询"库存量（主单位）"时应使用 `FQty`；查"库存量（基本单位）"用 `FBaseQty`
- 两者数值相同的前提是主单位与基本单位换算率为 1:1

### ⚠️ 弹性字段（ElementType=60523）查询格式说明

弹性字段（仓位 `FStockLocId`、辅助属性 `FAuxPropId`）的查询格式规则：

```
父Key.子FieldName → 返回 ID（数值或文本）
父Key.子FieldName.FName → 返回关联档案名称（推荐用于色号等关联字段）
父Key.子FieldName.FNumber → 返回关联档案编码
```

**字段对照：**

| 查询字段名 | 中文含义 | 返回示例 |
|-----------|---------|---------|
| `FAuxPropId.FF100001.FName` | 色号名称 | `8525,桃粉` |
| `FAuxPropId.FF100001.FNumber` | 色号编码 | `SH002143` |
| `FAuxPropId.FF100002` | 缸号 | `QH260414` |
| `FStockLocId.FF100004.FName` | 少云纱线仓位名称 | `A-2-14` |
| `FStockLocId.FF100002.FName` | 色卡仓位名称 | — |

**重要：** `query_metadata` 返回的子字段 `Key`（如 `FAUXPROPID__FF100001`）是元数据标识符，**不能直接用于查询**，查询时必须使用 `父Key.子FieldName` 格式。

### ⚠️ 自定义字段说明

`F_JR_FHTZDKYL` 和 `F_JR_FHTZQTY` 为隐藏版本（`IsViewVisible=false`），**不可用于查询**；
应使用 `F_JR_FHTZDKYL1`（开单可用量）和 `F_JR_FHTZQTY1`（开单未发货数量）。

### ⚠️ 入库日期说明

`STK_Inventory` 中**没有直接的入库日期字段**。界面显示的入库日期来源于批次档案（`BD_BatchMainFile`），需通过 `FLot.FNumber` 关联 `STK_InStock` 查询对应的 `FDate`。

### ❌ 禁用字段

| 错误字段名 | 说明 |
|-----------|------|
| `FNumber` | 不存在，物料编号是 `FMaterialId.FNumber` |
| `FStockQty` | 不存在，库存量用 `FQty`（主单位）或 `FBaseQty`（基本单位） |
| `FLowStockQty` | 不存在 |
| `FMinStockQty` | 不存在（安全库存不在这张表） |
| `FAvailableQty` | 不存在，可用量字段是 `FAVBQty` |
| `FAuxQty` | 不存在，开单可用量是自定义字段 `F_JR_FHTZDKYL1` |
| `FStockDate` / `FInboundDate` | 不存在，无直接入库日期字段 |
| `FForbidStatus` | 不存在于库存视图（存在于 `BD_MATERIAL`） |
| `F_JR_FHTZDKYL` | 已隐藏（`IsViewVisible=false`），使用 `F_JR_FHTZDKYL1` |
| `F_JR_FHTZQTY` | 已隐藏（`IsViewVisible=false`），使用 `F_JR_FHTZQTY1` |
| `FAuxPropId` | 弹性父键，不可直接查询，触发 500；改用 `FAuxPropId.FF100001.FName`（色号名称）、`FAuxPropId.FF100002`（缸号） |
| `FStockLocId` | 弹性父键，不可直接查询，触发 500；改用 `FStockLocId.FF100004.FName`（少云纱线仓位）等子字段格式 |
| `FAUXPROPID__FF100001` | metadata Key 格式，不可用于查询，触发 500；改用 `FAuxPropId.FF100001.FName` |
| `FAUXPROPID__FF100002` | metadata Key 格式，不可用于查询，触发 500；改用 `FAuxPropId.FF100002` |
| `FSTOCKLOCID__FF100002` | metadata Key 格式，不可用于查询，触发 500；改用 `FStockLocId.FF100002.FName` |
| `FSTOCKLOCID__FF100004` | metadata Key 格式，不可用于查询，触发 500；改用 `FStockLocId.FF100004.FName` |
| `FAuxPropId__FF100001` / `FAuxPropId__FF100002` / `FStockLocId__FF100004` | 双下划线拼接格式，触发 500 |
| `FF100001` / `FF100002` / `FF100004` | 裸 FieldName 不可查询，触发 500；必须带父 Key 前缀 |

### ⚠️ 安全库存说明

- 安全库存设置在物料档案 `BD_MATERIAL` 的 `[库存]` 子表，字段为 `FSafeStock`，无法通过 `STK_Inventory` 直接比对
- **实用替代**：查 `FBaseQty = 0` 或 `FBaseQty < N` 识别零库存/低库存物料
- 系统中没有直接可查的"低于安全库存"视图

---

## 七、客户 BD_Customer

> ⚠️ 以下规则仅适用于 BD_Customer（客户档案）

### ✅ 基础信息字段

| 字段名 | 含义 | 备注 |
|--------|------|------|
| `FName` | 客户名称 | 支持 `like '%xx%'` |
| `FNumber` | 客户编号 | 唯一标识，如 `CTM-0536` |
| `FShortName` | 简称 | 常为空 |
| `FCreateDate` | 创建日期 |  |
| `FModifyDate` | 最后修改日期 |  |
| `FAddress` | 地址 | 常为空 |
| `FMobile` | 手机 | 常为空（实际手机号通常存在自定义字段中） |
| `FEmail` | 邮箱 | 常为空 |
| `FDescription` | 描述 | 常为空 |
| `FCurrencyId` | 货币ID |  |
| `FCreateOrgId` | 创建组织ID |  |
| `FUseOrgId` | 使用组织ID |  |

### ✅ 自定义扩展字段（示例，各部署不同）

> 以下为自定义字段示例，字段名以公司内部前缀区分（如 `F_JR_`）。你的部署中前缀可能不同。
> 使用前先调用 `query_metadata(form_id="BD_Customer")` 查看实际可用的自定义字段。

| 字段名（示例） | 含义 | 备注 |
|--------|------|------|
| `F_XX_LXR` | 联系人姓名 | 各部署前缀不同 |
| `F_XX_DH` | 联系电话 | 标准 `FMobile` 常为空，实际手机号可能在自定义字段 |
| `F_XX_DZ` | 联系地址 | 标准 `FAddress` 常为空，实际地址可能在自定义字段 |
| `F_XX_KHSR` | 客户生日（日期） | 含年份，格式 `1990-03-24T00:00:00` |
| `F_XX_KHSRYF` | 客户生日月份 | **按月筛选用这个**，值为字符串如 `'3'` |
| `FKHLB` | 客户类别 | 返回 ID，需映射（见下方示例） |
| `FFWZY` | 服务专员 | 返回 ID，需映射 |
| `FSOCIALCRECODE` | 统一社会信用代码 |  |
| `FKHQY` | 客户区域 | 关联枚举，返回 ID，需映射 |
| `FGroup` | 客户分组 | 嵌套对象，取名称用 `FGroup.FName`（如「现金组」） |
| `F_JKFSNEW` | 结款方式（当前有效） | 关联枚举，返回 ID，需映射 |

**发现自定义字段的方法：**

```python
query_metadata(form_id="BD_Customer")
```

从返回结果中找以 `F_` 开头的字段，`IsViewVisible=false` 表示已废弃。

### ❌ 废弃/不存在字段

| 字段名 | 说明 |
|--------|------|
| 旧版自定义字段 | 若元数据中 `IsViewVisible=false` 则已废弃，改用对应的新字段 |
| `FContact` | 不存在，联系人在自定义字段中 |
| `FPhone` | 不存在，手机号在自定义字段中 |
| `FIsArchive` | 不存在 |
| `FSaleOrgId` | 不存在 |
| `FID` | 不存在（内码用 `view_bill` 的 id 参数查） |
| `F_JR_KHLB` | 已废弃，客户类别改用 `FKHLB` |
| `F_JR_JKFS` | 已废弃，结款方式改用 `F_JKFSNEW` |
| `F_JR_FWZY` | 已废弃，服务专员改用 `FFWZY` |

### ID 映射（动态发现方法）

`FKHLB`（客户类别）、`FFWZY`（服务专员）等关联字段返回的是内部 ID，需要映射到名称。

**发现 ID 映射的步骤：**

1. 查询客户列表时带上 `FKHLB,FFWZY` 字段，记录返回的 ID 值
2. 用 `view_bill(form_id="BD_Customer", number="某客户编号")` 查看完整记录
3. 从返回的嵌套 JSON 对象中读取 ID 对应的名称
4. 将映射关系记录下来，后续复用

> 建立映射表后，将常用 ID 记录在此处供后续查询使用。

---

## 八、物料 BD_MATERIAL

> ⚠️ 以下规则仅适用于 BD_MATERIAL（物料档案）

### ✅ 已验证可用字段（标准字段）

| 字段名 | 含义 | 备注 |
|--------|------|------|
| `FNumber` | 物料编码 | 唯一编码 |
| `FName` | 物料名称 |  |
| `FSpecification` | 物料成分 | ⚠️ 本部署中此字段实际存储"物料成分"，非通用"规格型号"，见下方说明 |
| `FMaterialGroup.FName` | 物料分组 |  |
| `FBaseUnitId.FName` | 基本计量单位 |  |
| `FCreateOrgId.FName` | 创建组织 |  |
| `FUseOrgId.FName` | 使用组织 |  |
| `FForbidStatus` | 启用状态 | A=启用, B=禁用 |
| `FDocumentStatus` | 数据状态 |  |
| `FCreateDate` | 创建日期 |  |
| `FModifyDate` | 修改日期 |  |
| `FMnemonicCode` | 助记码 |  |
| `FIsBatchManage` | 启用批号管理 | `[库存]` 子表字段 |
| `FSafeStock` | 安全库存（基本单位） | `[库存]` 子表字段 |
| `FDefaultVendor` | 默认供应商 | `[采购]` 子表字段 |

### ✅ 已验证可用字段（本部署自定义字段）

> 以下字段为本部署特有，前缀为 `F_JR_` 或 `F_TRPN_`，其他部署不通用。

| 字段名 | 含义 | 备注 |
|--------|------|------|
| `F_JR_ZS` | 支数 | 如 `2/28NM` |
| `F_TRPN_jr_gys` | 供应商 | 物料档案中的供应商字段 |
| `F_jr_gysjc` | 供应商简称 |  |
| `F_JR_GHJ` | 供应商报价 |  |
| `F_JR_LSJ` | 建议售价 |  |
| `F_JR_THBJ` | 同行报价 |  |
| `F_JR_VIPJ` | VIP价 |  |
| `F_JR_WMKHJ` | 外贸客户价 |  |
| `F_JR_FCCPMC` | 原本名 |  |

### ⚠️ FSpecification 字段说明

标准金蝶中 `FSpecification` 通常对应"规格型号"，但**本部署已将其重命名为"物料成分"**，实际存储的是纱线成分信息（如 `45.4腈纶28锦纶26.6聚酯纤维`）。跨系统迁移时需注意此差异。

### ❌ 废弃/不存在字段

| 字段名 | 说明 |
|--------|------|
| `F_JR_SPZB` | 已禁用（`IsViewVisible=false`） |

---

## 九、供应商 BD_Supplier

> ⚠️ 以下规则仅适用于 BD_Supplier（供应商档案）
> BD_Supplier 由多个实体组成：主表（单据头）+ 多个子表（基本信息、商务信息、财务信息、银行信息、联系人）。
> **重要**：子表字段（FBaseInfo / FBusinessInfo / FFinanceInfo 等）在 query_bill_json 中无法直接跨表查询，主表字段可直接使用。

### ✅ 主表可用字段（可直接用于 query_bill_json）

主表对应数据库表 `t_BD_Supplier`，以下字段经过实测验证可直接查询：

| 字段名 | 含义 | 备注 |
|--------|------|------|
| `FNumber` | 编码 | 唯一标识，如 `RC2014-J` |
| `FName` | 名称 | 支持 `like '%xx%'` 模糊查询 |
| `FShortName` | 简称 | 常为空 |
| `FDocumentStatus` | 数据状态 | Z=暂存 / A=创建 / B=审核中 / C=已审核 / D=重新审核 |
| `FForbidStatus` | 禁用状态 | A=否（启用中）/ B=是（已禁用） |
| `FInvoiceType` | 发票类型（财务信息页签） | 枚举：1=增值税专用发票 / 2=普通发票 |
| `FPayCondition` | 付款条件（财务信息页签） | 返回整数 ID，0=无 |
| `F_HZLX` | 合作类型 | 1=供应商 / 2=染厂 / 3=委外加工厂 |
| `F_JR_JSFS` | **结算方式**（自定义） | 枚举：1=付发 / 2=发现 / 3=月结 / 4=期结 |
| `F_JR_JKFS` | 结款方式 | 关联 TRPN_JKFS，返回 ID |

### ❌ 禁用字段（会触发 500）

以下字段在元数据中不存在，实测均报错，禁止在 query_bill_json 中使用：

| 错误字段名 | 说明 |
|-----------|------|
| `FSettleType` | 不存在，「结算方式」见下方说明 |
| `FContact` / `FPhone` | 不存在，联系人/电话在子表 FSupplierContact 中 |
| `FIsEnabled` | 不存在（启用状态用 FForbidStatus） |
| `FTaxRate` | 不存在（默认税率在财务信息子表的 FTaxRateId） |

### ⚠️ 「结算方式」字段特别说明

界面上的「结算方式」在 BD_Supplier 中实际有**两个不同字段**，含义不同：

| 字段名 | 所在位置 | 含义 | 数据类型 |
|--------|---------|------|---------|
| `F_JR_JSFS` | 主表（自定义字段） | 本部署业务定义的结算周期方式，可在 query_bill_json 中直接使用 | 枚举：1=付发 / 2=发现 / 3=月结 / 4=期结 |
| `FSettleTypeId` | 商务信息子表（FBusinessInfo） | 系统标准结算方式，关联 BD_SETTLETYPE 基础资料 | 关联 ID，不可在主表 query_bill_json 中直接查询 |

**实际使用建议**：
- 如需通过 query_bill_json 过滤「期结」供应商，使用 `F_JR_JSFS = '4'`
- `FSettleTypeId` 属于商务信息子表，query_bill_json 无法直接访问，需通过 view_bill 查看完整记录

---

## 十、字段查询优先级

当不确定字段名时，按以下顺序确认：

1. **查本文档**：本文件记录了已验证的常用字段
2. **查 SKILL.md 表单速查表**：确认表单ID是否正确
3. **查 field-rules.md 字段规则速查**：metadata 转换规则、高频错误字段映射
4. **调用 query_metadata**：实时验证字段是否存在
5. **查看已有单据**：用 `view_bill` 查看同类型单据的完整数据结构
6. **测试查询**：先用 `top_count=1` 小范围测试，确认字段可用后再扩大查询范围

---

## 十一、跨表字段差异速查

同一语义字段在不同表单中 **字段名可能不同**，避免跨表复用：

| 场景 | 在 SAL_SaleOrder 中 | 在 SAL_OUTSTOCK 中 | 在 STK_Inventory 中 |
|------|-------------------|-------------------|-------------------|
| 客户 | ✅ `FCustId.FName` | ❌ **不存在**（需从关联订单获取） | ❌ **不存在** |
| 物料 | ✅ `FMaterialId.FName`（表体） | ✅ `FMaterialId.FName`（表体） | ✅ `FMaterialId.FName` |
| 数量 | ✅ `FQty`（表体） | ✅ `FQty`（表体） | ✅ `FQty` |
| 含税金额 | ✅ `FAllAmount`（行级） | ✅ `FAllAmount`（行级） | ❌ **不存在** |
| 仓库 | ✅ `FStockId.FName` | ✅ `FStockId.FName` | ✅ `FStockId.FName` |
| 单据编号 | ✅ `FBillNo` | ✅ `FBillNo` | ❌ **不存在** |

### 高频跨表复用陷阱

| ❌ 错误做法 | 原因 | 正确做法 |
|-----------|------|---------|
| 在 SAL_OUTSTOCK 中用 `FCustId.FName` | 销售出库单表头没有客户字段 | 通过销售订单号关联查询客户 |
| 在 STK_Inventory 中用 `FBillNo` | 库存视图没有单据关联 | 库存视图只能用物料/仓库等维度 |
| 在 BD_Customer 中用 `FBillNo` | 客户档案没有单据字段 | 客户查询用 `FName`、`FNumber` |

---

## ⚠️ FAllAmount 不同场景分组规则补充

| 分析场景 | 正确做法 | 常见错误 |
|---------|---------|---------|
| **按客户汇总销售额** | 先按 `FBillNo` 分组对行级 `FAllAmount` 求和得订单总额，再按 `FCustId.FName` 汇总 | 直接按客户对行级 `FAllAmount` 求和 → 金额翻倍 |
| **按物料汇总销量** | 直接按 `FMaterialId.FName` 对行级 `FAllAmount` 求和 | **不需要**按 FBillNo 去重 |
| **按业务员汇总** | 先按 `FBillNo` 分组求订单总额，再按 `FSalerId.FName` 汇总 | 同一订单多条物料重复加给业务员 |
| **查询订单列表展示** | 带行号 `FSeq` 展示，说明同一订单可能有多行 | 误以为每行是一个独立订单 |
