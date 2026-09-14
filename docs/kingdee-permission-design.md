# 金蝶权限管理改造 · 实施方案

> 版本：v1.3（已实施）
> 状态：方案文档 + 代码实施完成（2026-08-25）
> 适用范围：`CowAgent` 权限管理页面中的**金蝶权限**部分
> 关联原型：`prototype/kingdee-permissions-prototype.html`（v4）

---

## 1. 背景与目标

现有金蝶权限只支持「启用/禁用」单一开关（`user_permissions[userid] = {enabled}`），无法回答：

- 用户能查金蝶的**哪些表单**（销售/采购/库存/应收…）
- **销售类**单据是否按「业务员」过滤（本人/本人+下属/全部）
- 公司**高层**如何直接看全部数据

本次改造目标：把金蝶权限升级为**「表单授权 + 销售数据范围 + 超级账户」**三层模型，并在**所有金蝶查询入口**（Web 看板、Agent 聊天、统计接口）统一强制生效。

---

## 1.1 与现状的差距分析（重要）

> **⚠️ 重要**：经代码核查，**权限管理页面的前后端骨架已全部存在**，本方案**不是从零新增页面**，而是**升级金蝶部分为三层模型**。照 plan 的"新增菜单/视图/路由"等步骤操作会重复建设。

### 已存在的部分（无需重复做）

| 层 | 位置 | 现状 |
|----|------|------|
| 侧边栏菜单 | `chat.html:207` `data-view="permissions"` | ✅ 已存在 |
| 权限视图容器 | `chat.html:1258` `view-permissions` | ✅ 已存在 |
| i18n | `console.js:17-23` | ✅ 已存在 |
| VIEW_META | `console.js:1748` | ✅ 已存在 |
| 导航钩子 | `console.js:10744` | ✅ 已存在 |
| 权限 API 路由 | `web_channel.py:2178-2182` | ✅ 5 个 Handler 已存在 |
| 金蝶查询 Handler | `web_channel.py:2183-2187` | ✅ 已存在 |
| 前端金蝶逻辑 | `permissions.js:458-609` | ✅ 已存在（单一 enabled） |
| 权限检查 | `permission_checker.py` + `agent_stream.py:1721` | ✅ 已存在（单一 enabled） |

### 真正要改的（金蝶升级）

| 层 | 位置 | 改动 |
|----|------|------|
| 权限模型 | `permission_checker.py` | 新增 form_access/scope/super_admin 相关函数 |
| 金蝶 handler | `web_channel.py` 5 个 | 接入 `build_kingdee_form_filter` |
| 登录入口 | `WecomOAuthCallback`/`ChatHandler` | 接入 `has_kingdee_form_access` |
| Agent 拦截 | `agent_stream.py:1721` | 过滤注入 + user_id 空拒绝 |
| 金蝶列表 | `permissions.js:485` `renderPermissionsKingdee` | 加"角色/表单""数据范围"列 |
| 金蝶 modal | `chat.html:2491` + `permissions.js:580` | 重写为三层模型 |
| 保存校验 | `PermissionsConfigHandler` | 新增 form/role/循环校验 |

---

## 2. 核心设计决策（多轮确认结论）

| # | 决策 | 结论 |
|---|------|------|
| 1 | 权限维度 | 只控制「可访问哪些金蝶表单」+ 销售类数据范围，不做全表单人员过滤 |
| 2 | 表单授权粒度 | 预置**角色组** + 自定义微调（追加/移除） |
| 3 | 数据范围 | 仅对**销售类表单**生效：`self` / `self_and_subordinates` / `all` |
| 4 | 非销售岗 | scope 恒为 `all`（在授权表单内看全部），兜底避免查不到数据 |
| 5 | 超级账户 | 全局名单 `super_admins`，优先级最高，看所有表单与数据 |
| 6 | 上下级来源 | 手工维护 `direct_subordinates`（不走 `leader_userid`，因该字段当前全为空） |
| 7 | 循环校验 | 前端 + 后端双重校验，不能选自己/上级 |
| 8 | 姓名匹配 | 企微姓名 → 剥离昵称后缀 → 匹配金蝶 `FSalerId.FName` |
| 9 | 风险分级 | 只存储 + 预留拦截，不影响本次过滤 |
| 10 | 角色映射 | 由**后端下发**（存 config），避免前后端不一致 |

---

## 3. 数据模型（`tmp/permission_config.json`）

```json
{
  "enabled": true,
  "knowledge_permissions": {
    "folder_permissions": {}
  },
  "kingdee_permissions": {
    "default_strategy": "deny",
    "super_admins": ["YueJinHui"],
    "form_roles": {
      "sales":    ["SAL_SaleOrder", "SAL_QUOTATION", "SAL_OUTSTOCK", "BD_Customer"],
      "business": ["PUR_PurchaseOrder", "STK_InStock", "BD_Supplier", "BD_Customer"],
      "finance":  ["AR_receivable", "PUR_PurchaseOrder", "BD_Supplier"],
      "rd":       ["BD_MATERIAL", "STK_Inventory", "SAL_OUTSTOCK"]
    },
    "sale_scoped_forms": ["SAL_SaleOrder", "SAL_OUTSTOCK"],
    "user_permissions": {
      "ZhangSan": {
        "enabled": true,
        "scope": "self",                    // self | self_and_subordinates | all
        "role": "sales",
        "extra_forms": [],
        "removed_forms": [],
        "direct_subordinates": ["LiMeng"],
        "risk_level": "low"
      }
    }
  },
  "audit_log": []
}
```

**关键字段说明**：
- `super_admins`：全局超级账户（企微真实 userid），优先级最高。
- `form_roles`：角色 → 默认表单集（后端维护，前端只读展示）。
- `sale_scoped_forms`：需要按业务员过滤的「销售类」表单清单。
- 每个用户的有效表单 = `form_roles[role] + extra_forms - removed_forms`。

**表单清单（基于金蝶 MCP 实测，2026-08-26）**：
> 通过项目 MCP 实际查询验证，全部 13 个表单真实存在：

| form_id | 中文名 | 角色 | 实测 |
|---------|--------|------|------|
| SAL_SaleOrder | 销售订单 | sales | ✅ 有数据 |
| SAL_OUTSTOCK | 销售出库单 | sales | ✅ 有数据 |
| SAL_QUOTATION | 报价单 | sales | ✅ 有数据 |
| SAL_RETURNSTOCK | 销售退货单 | sales | ✅ 有数据 |
| SAL_DELIVERYNOTICE | 发货通知单 | sales | 表单有效（暂无数据） |
| SAL_AvailableQuery | 可发量查询 | — | 表单有效（暂无数据） |
| SVM_InquiryBill | 采购询价单 | business | 表单有效（暂无数据） |
| SVM_QuoteBill | 供应商报价单 | business | 表单有效（暂无数据） |
| SVM_ComparePrice | 比价单 | business | 表单有效（暂无数据） |
| PUR_PurchaseOrder | 采购订单 | business/finance | 保留（集成账号无权限） |
| PUR_Requisition | 采购申请单 | business | 保留（集成账号无权限） |
| STK_InStock | 采购入库单 | business | 保留（集成账号无权限） |
| STK_Inventory | 库存查询 | rd | ✅ 有数据 |
| AR_receivable | 应收账款 | finance | ✅ 有数据 |
| AP_PAYBILL | 付款单 | finance | 保留（集成账号无权限） |
| BD_Customer | 客户档案 | sales/business | ✅ 有数据 |
| BD_Supplier | 供应商档案 | business/finance | ✅ 有数据 |
| BD_MATERIAL | 物料档案 | rd | ✅ 有数据 |
| BD_Department | 部门 | rd | ✅ 有数据 |
| BD_Unit | 计量单位 | rd | ✅ 有数据 |

> 说明（全量实测 47 个候选表单，2026-08-26）：
> - **有数据**（11 个）为集成账号可实际查到数据的表单。
> - **表单有效暂无数据**（5 个）为真实表单，查询成功但当前无记录。
> - **保留**（4 个：采购订单/采购申请/采购入库/付款单）为真实业务表单，集成账号无查看权限（金蝶侧配置）。保留在权限清单，未来加权限即可查。
> - 额外确认 3 个有数据表单（销售退货/部门/计量单位）已纳入清单。

**大小写策略**：
> 金蝶 BOS 的 form_id **大小写不敏感**（`AR_receivable` 与 `AR_Receivable` 等价）。权限判断统一按**大写**比较（`_norm_form_id`），既兼容 SKILL.md 现有写法，也兼容 MCP FORM_META 的驼峰写法，避免改坏现有 handler。

---

## 4. 权限检查逻辑（`common/permission_checker.py`）

### 4.1 判断优先级（顺序不能错）

```
1) 权限管理未启用            → 全部放行
2) userid 是 session_ 管理员  → 全部放行
3) userid ∈ super_admins     → 全部表单 + 全部数据
4) 用户 enabled = false       → 拒绝
5) form_id ∉ 有效表单         → 拒绝该表单（含清单外表单，防止绕过）
6) form_id ∈ sale_scoped_forms 且 scope != all → 追加业务员过滤
7) 其余                       → 放行（form_id 已授权）
```

> **安全修复（2026-08-26）**：`build_kingdee_form_filter` 不再对"不在权限清单内的 form_id"放行。
> 原先为兼容内部探索（如 `SAL_QUOTATION`）加的白名单放行存在**绕过风险**（用户可查询未列出的表单绕过权限）。
> 现在所有清单内的表单（`SAL_SaleOrder` 等）均已纳入目录，内部功能不受影响，故移除放行逻辑，
> 改为：普通用户查询**任何**表单都必须有对应权限（含清单外表单），管理员/超管不受限。

### 4.2 新增/重构函数

```python
# permission_checker.py

def get_kingdee_form_access(userid: str) -> Optional[set]:
    """
    返回用户可访问的 form_id 集合。
    - 未启用权限 → None（不限制）
    - 管理员 / super_admin → None（不限制）
    - 否则 → { 有效表单 }
    """

def has_kingdee_form_access(userid: str) -> Optional[set]:
    """
    登录入口用的便捷判断（等价于 get_kingdee_form_access）。
    返回 None 表示不限（管理员/超管/未启用权限），
    返回 set（可为空）表示用户的授权表单集合。
    登录时据此判断"无表单用户"是否允许进入金蝶看板。
    """

def get_kingdee_scope(userid: str) -> str:
    """返回用户 scope（super_admin 返回 'all'，默认 'all'）。"""

def get_user_subordinates(userid: str, config: dict) -> list:
    """递归返回直接/间接下属 userid 集合（基于 direct_subordinates）。"""

def build_kingdee_form_filter(userid: str, form_id: str, filter_string: str) -> Optional[str]:
    """
    统一过滤入口（Web handler 与 Agent 拦截点共用）：
    - 无表单权限 → 返回 None（表示应拒绝）
    - 销售类 + scope=self/self_and_subordinates → 返回追加业务员条件后的 filter_string
    - 否则 → 返回原 filter_string（不变）
    """
```

### 4.3 业务员条件构造

```python
def _saler_condition(userid, form_id, scope):
    # 按表单选择正确的业务员字段（见 SALER_FIELD_BY_FORM）
    saler_field = SALER_FIELD_BY_FORM.get(form_id, 'FSalerId')
    names = [剥离昵称后的中文名] + (下属中文名 if scope==self_and_subordinates else [])
    if not names: return None
    return f"{saler_field}.FName IN ('{'\',\''.join(names)}')"
```

`scope=self` 且无法匹配到姓名 → 返回 `1=1 AND 1=0`（确保查不到数据，而非放行）。

> **⚠️ 重要（2026-08-27 实测修复）**：不同销售类表单的**业务员字段名不同**，不能统一用 `FSalerId`。
> 通过金蝶元数据实测确认：

| 表单 | 业务员字段 |
|------|-----------|
| SAL_SaleOrder 销售订单 | `FSalerId` |
| SAL_QUOTATION 报价单 | `FSalerId` |
| SAL_OUTSTOCK 销售出库单 | `FSalesManID`（无 FSalerId） |
| SAL_RETURNSTOCK 销售退货单 | `FSalesManId`（无 FSalerId） |

> 此前统一用 `FSalerId` 过滤出库单/退货单会报「无法绑定标识符 FSalerId.FName」，
> 导致**给了出库单权限却查不了**。已修复为按表单选择业务员字段。

> **应收单字段修复（2026-08-27）**：
> - 应收单 `AR_receivable` 的业务员字段是 **`FSALEERID`**（不是 `FSalerId`）
> - 应收单"已收/结算金额"用 **`FRECEIVEAMOUNT`**（实收金额），`FRECTOTALAMOUNTFOR` 在元数据中**不存在**
> - 已同步修复 `KingdeeArOverdueHandler._discover_ar_fields` 的 fallback 兜底字段和 AGENT.md 应收账款分析文档

### 4.4 表单业务员字段核实（待确认）

`sale_scoped_forms` 中的表单**是否都支持 `FSalerId` 字段**需在实施前核实：

| 表单 | `FSalerId` 现状 |
|------|----------------|
| `SAL_SaleOrder`（销售订单） | ✅ 已验证存在（`verified-fields.md` 43行） |
| `SAL_QUOTATION`（报价单） | ⚠️ 需核实（`verified-fields.md` 未记录该表单字段） |
| `SAL_OUTSTOCK`（销售出库单） | ⚠️ 表头无 `FCustId`（117行），业务员字段待核实（502行依赖 `FSalerId.FName`） |
| `AR_receivable`（应收） | ✅ 有 `FSalerId.FName`（7708行），但归非销售类 |

- 若某销售类表单**无 `FSalerId`**，则该表单的 scope 过滤**降级为不做过滤**（仅靠 form_access 授权），避免构造非法 filter 报错。
- `AR_receivable` 有业务员字段，但财务岗 scope=all 用不上；保留在非销售类即可。

---

## 5. 过滤落地（统一入口，两处复用）

### 5.1 公共函数提取

新增 `build_kingdee_form_filter(userid, form_id, filter_string)`，Web handler 与 Agent 拦截点**都调用它**，避免重复实现导致不一致。

### 5.2 Web handler（`web_channel.py`）

需要接入的金蝶查询点：

| Handler | 使用的 MCP 工具 | 表单 | 过滤方式 |
|---------|------|------|------|
| `KingdeeKanbanHandler` | `query_bill_json` / `count_bill` | 多表单看板 | form_access + scope |
| `KingdeeBillDetailHandler` | **`view_bill`** + `query_bill_json`(补查) | 单据详情 | **仅 form_access**（详情是单条，不追加业务员过滤） |
| `KingdeeConversionStatsHandler` | `query_bill_json` | SAL_SaleOrder / SAL_QUOTATION | form_access + scope |
| `KingdeeConversionCustomerBillsHandler` | `query_bill_json` | 销售/采购 | form_access + scope |
| `KingdeeArOverdueHandler` | `query_bill_json` / `query_bill_all` | AR_receivable | form_access |

**⚠️ 工具覆盖**：除了 `query_bill_json` / `count_bill` / `query_bill_all`，**`view_bill` 也必须接入表单权限校验**。
- `view_bill({form_id, number})` 通过单据号直查详情（6204 行）。
- 若不校验，用户可凭单据号绕过列表过滤，直接查看**无表单权限**的单据详情。
- `view_bill` 不追加业务员过滤（详情是单条记录），但必须 `get_kingdee_form_access(userid)` 判断 `form_id` 是否有权。
- `query_metadata` 仅作字段探索，不返回业务数据，**可放行**（但要确认其不泄露表单数据）。

每个 handler 在执行 `tool.execute({...filter_string...})` 前调用：
```python
userid = _get_current_wecom_userid()   # 或从 auth 会话解析
new_filter = build_kingdee_form_filter(userid, form_id, filter_string)
if new_filter is None:
    return 权限不足(该表单无权限)
# 用 new_filter 替换原 filter_string
```

> 注意：`query_bill_all` / `count_bill` 等工具同样要经过此入口。
>
> **运行时常量**：看板/统计 handler 必须在**每次请求运行时**调用 `build_kingdee_form_filter` 判断权限，**不得依赖登录会话里缓存的 `kingdee_allowed` 布尔值**。否则管理员修改配置后，用户需重新登录才生效，且"无表单"用户可能因旧会话仍进入看板。

### 5.2.1 登录入口校验（`WecomOAuthCallback`，约 2480 行）

现有企微 OAuth 回调在登录时已调用 `check_kingdee_permission` 判 `allowed`，但**只看了 `allowed`，未校验"至少一个有效表单"**。改造后：

```python
from common.permission_checker import has_kingdee_form_access  # 新增
form_access = has_kingdee_form_access(userid)   # None=不限(管理员/超管)，set=有效表单
if not allowed:
    return 权限不足页("没有金蝶查询权限，请联系管理员开通")
if form_access is not None and len(form_access) == 0:
    return 权限不足页("尚未配置金蝶表单权限，请联系管理员")
```

- `ChatHandler`（约 2847 行）的 direct OAuth 入口做同样校验。
- **无表单用户**：禁止进入金蝶看板，提示"请联系管理员配置表单权限"。

### 5.3 Agent 拦截点（`agent_stream.py`）

现有金蝶分支（约 1721-1733 行）只做 `allowed/denied` 且丢弃 `scope`。改造为：

```python
if getattr(tool, 'server_name', None) == 'kingdee-k3cloud':
    user_id = getattr(self.agent, 'current_user_id', None)
    if user_id and is_permissions_enabled():
        form_id = arguments.get('form_id')
        fs = arguments.get('filter_string', '')
        new_fs = build_kingdee_form_filter(user_id, form_id, fs)
        if new_fs is None:
            return {"status":"error", "result":"权限不足：无该表单权限", ...}
        if new_fs != fs:
            arguments['filter_string'] = new_fs   # 注入过滤
```

### 5.4 `current_user_id` 为空的处理（定时任务/多智能体）

**决策**：`current_user_id` 为空时，默认**拒绝金蝶工具**（安全优先），并打日志。避免静默越权。

---

## 6. 前端界面（`chat.html` + `permissions.js`）

> 前端**骨架已存在**（菜单/视图/Tab/modal 容器），以下为**在金蝶 Tab 内升级**的具体改动，均基于现有函数改造。

### 6.1 列表页「金蝶权限」Tab（改造 `renderPermissionsKingdee`，permissions.js:485）

现有列：用户 / 部门 / 启用 / 操作（`permissions.js:499-525`）。改造后：

| 列 | 说明 |
|----|------|
| 用户 | 超级账户带 ★ |
| 部门 | - |
| 角色/表单 | `销售·4个表单` / `★全部` / `待配置` / `无表单!` |
| 数据范围 | 仅本人 / 本人+下属(N) / 全部 |
| 启用 | 开关 |
| 操作 | 编辑 |

- 保留现有搜索/部门筛选（`permissions-kingdee-search`、`permissions-kingdee-department-filter`）。
- 新增"角色/表单""数据范围"两列渲染逻辑。

### 6.2 编辑弹窗（重写现有 modal，chat.html:2491 + `savePermissionsKingdeeModal`）

现有 modal 仅一个 `enabled` 复选框（chat.html:2511）。重写为：

1. 启用开关
2. **表单授权**：基础角色下拉 + 表单多选网格（角色默认勾选，可微调）
   - 启用但 0 表单 → 红色警示 + 保存拦截
   - 旧配置迁移 → 黄色「待配置」标签
3. **销售数据范围**：仅本人 / 本人及下属 / 全部（非销售岗默认全部）
4. **直接下属**（仅「本人及下属」显示）：多选 + 循环限制
5. **风险等级**：下拉（预留）
6. 超级账户：表单与数据范围锁定

保存逻辑 `savePermissionsKingdeeModal` 从 `{enabled}` 改写为 `{enabled, scope, role, extra_forms, removed_forms, direct_subordinates, risk_level}`。

### 6.3 超级账户配置

金蝶 Tab 顶部新增金色配置条 + 多选弹窗；设为超级账户的用户看全部表单/数据。

### 6.4 表单目录/角色映射

前端从后端接口获取（`form_roles`、`sale_scoped_forms`、表单清单），不硬编码。

---

## 7. 后端 API

> 现有权限 API **已存在**（`web_channel.py:2178-2182`）：`config` / `users` / `folders` / `sync-users` / `audit-log`。
> 本方案在现有 `PermissionsConfigHandler` 基础上**扩展新字段**，并新增 2 个接口。

| 接口 | 方法 | 现状 | 作用 |
|------|------|------|------|
| `/api/permissions/config` | GET/POST | ✅ 存在 | 读写配置（**扩展表单/角色/scope 字段 + 新增校验**） |
| `/api/permissions/kingdee-form-roles` | GET | 🆕 新增 | 返回表单目录、角色默认集、销售类表单清单 |
| `/api/permissions/kingdee/super-admins` | POST | 🆕 新增 | 保存超级账户名单 |
| `/api/permissions/users` | GET | ✅ 存在 | 用户列表（复用） |
| `/api/permissions/sync-users` | POST | ✅ 存在 | 同步企微用户（扩展清理新字段） |

**保存校验**（`PermissionsConfigHandler.POST` 新增，后端强制执行）：
- `role` 必须存在于 `form_roles`
- `extra_forms` / `removed_forms` 必须是合法 form_id
- `direct_subordinates` 无循环（DFS 校验）
- 启用时必须至少有一个有效表单
- 非超级账户不可设 `super_admin`

保存校验（POST 时后端强制执行）：
- `role` 必须存在于 `form_roles`
- `extra_forms` / `removed_forms` 必须是合法 form_id
- `direct_subordinates` 无循环（DFS 校验）
- 启用时必须至少有一个有效表单
- 非超级账户不可设 `super_admin`

---

## 8. 旧配置迁移

现有 `{enabled:true}`（无 role/无表单）的用户：
- 迁移策略：保留 `enabled`，`role` 置空、`extra_forms`/`removed_forms` 置空、`scope` 默认 `all`。
- 前端标记为**「待配置」**（黄色），提示管理员补充表单授权，否则该用户无任何表单权限。
- 不做自动默认角色（避免误授权），由管理员逐个确认。

**「待配置/无表单」用户的运行时行为**：
- **登录**：`has_kingdee_form_access(userid)` 返回空 set → 禁止进入金蝶看板，提示"请联系管理员配置表单权限"（见 5.2.1）。
- **Agent 聊天**：调用金蝶工具时 `build_kingdee_form_filter` 返回 None → 拒绝该表单查询。
- **一致性**：登录拦截 + 运行时拦截双保险，避免"能登录但查不到"或"绕过登录直接调用"。

---

## 9. 姓名匹配（业务员过滤）

企微姓名格式多样（`张小攀～Mark`、`龙超富-Dragon`、`张双团- Frosty`）。

剥离规则（`_strip_nickname`）：
1. 去掉末尾 `-xxx` / `～xxx` / ` xxx`（英文昵称）
2. 保留纯中文部分
3. 无匹配 → 该用户按「无数据」处理（`self` 时返回空结果）

> 若金蝶 `FSalerId.FNumber`（业务员编号）比中文名更可靠，可扩展 `fsaler_uid` 字段做精确映射（本轮不强制）。

---

## 10. 离职用户清理扩展

`_cleanup_invalid_user_refs`（现有逻辑）扩展：
- 清理 `user_permissions` 中 `direct_subordinates` 里的离职 userid
- 清理 `super_admins` 中的离职 userid
- 清理 `extra_forms` 中的非法 form_id（若配置了表单白名单）

---

## 11. 缓存

金蝶缓存键 `form_id|filter_string`：
- 因业务员过滤注入到 `filter_string`，不同用户 filter 不同 → 缓存天然含用户维度，**无泄露风险**。
- 前提：过滤必须落在 `filter_string`，而非取回结果后再过滤。

**count_bill 缓存一致性**：
- `count_cache_key = form_id|filter_string`（6075 行）同样依赖 filter 注入来区分用户。
- 因此 `count_bill` 调用（6083 行）**必须和 `query_bill_json` 一样走 `build_kingdee_form_filter` 注入**。
- 若 count 未注入而 list 注入，会出现「计数是全局、列表是过滤后」的数量不一致。

---

## 12. 待办清单（金蝶升级，plan 骨架已存在不再重复做）

> plan 的「新增侧边栏菜单 / 视图容器 / VIEW_META / 导航钩子 / i18n / 权限 API / 路由」**均已存在**（见 1.1），本清单只列**真正要改的**。

| # | 任务 |
|---|------|
| 1 | `permission_checker.py`：重构 `check_kingdee_permission` + 新增 `get_kingdee_form_access`/`has_kingdee_form_access`/`build_kingdee_form_filter`/`get_user_subordinates`/`_saler_condition` |
| 2 | `web_channel.py`：金蝶 handler 接入 `build_kingdee_form_filter`（query_bill_json / count_bill / query_bill_all / **view_bill**） |
| 3 | `agent_stream.py`：金蝶分支改为过滤注入 + user_id 为空拒绝 |
| 4 | `web_channel.py`：登录入口（WecomOAuthCallback / ChatHandler）接入 `has_kingdee_form_access` |
| 5 | `web_channel.py`：`PermissionsConfigHandler` 扩展新字段校验 + 新增 form-roles / super-admins API |
| 6 | `chat.html`：重写金蝶 modal（表单授权+scope+下属+风险） |
| 7 | `permissions.js`：改造 `renderPermissionsKingdee` + `savePermissionsKingdeeModal` + 超级账户 |
| 8 | `permission_checker.py`：离职清理扩展（direct_subordinates / super_admins） |
| 9 | 旧配置迁移逻辑 + 前端「待配置」标签 |
| 10 | 核实 SAL_QUOTATION / SAL_OUTSTOCK 是否支持 FSalerId（4.4） |

---

## 13. 风险与注意事项

- **Agent 定时任务越权**：`current_user_id` 为空默认拒绝（5.4）。
- **非销售岗 scope 兜底**：避免 `self` 导致查不到数据。
- **前后端角色一致**：角色映射由后端下发。
- **循环依赖**：前后端双重校验。
- **view_bill 绕过**：单据详情接口必须按 form_id 校验表单权限，否则可凭单据号直查无权限详情（5.2）。
- **count/list 一致性**：count_bill 与 query_bill_json 都要注入过滤，否则数量与列表不一致（11）。
