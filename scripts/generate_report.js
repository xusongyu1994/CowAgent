const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, LevelFormat,
  TableOfContents, HeadingLevel, BorderStyle, WidthType, ShadingType,
  PageNumber, PageBreak
} = require('docx');

// ============================================================
// Constants
// ============================================================
const A4_WIDTH = 11906;
const A4_HEIGHT = 16838;
const MARGIN = 1440;
const CONTENT_WIDTH = A4_WIDTH - MARGIN * 2;

const BLUE = "1A3A5C";
const LIGHT_BLUE = "D5E8F0";
const MID_BLUE = "2E75B6";
const GRAY = "F2F2F2";
const DARK_GRAY = "666666";

const FONT_HEADING = "微软雅黑";
const FONT_BODY = "宋体";
const FONT_CODE = "Consolas";

// ============================================================
// Helper functions
// ============================================================
function heading1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    children: [new TextRun({ text, font: FONT_HEADING, size: 36, bold: true, color: BLUE })],
    spacing: { before: 400, after: 200 },
  });
}

function heading2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    children: [new TextRun({ text, font: FONT_HEADING, size: 28, bold: true, color: BLUE })],
    spacing: { before: 300, after: 150 },
  });
}

function heading3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    children: [new TextRun({ text, font: FONT_HEADING, size: 24, bold: true, color: "333333" })],
    spacing: { before: 200, after: 100 },
  });
}

function para(text, opts = {}) {
  const runs = [];
  if (typeof text === 'string') {
    runs.push(new TextRun({
      text,
      font: opts.font || FONT_BODY,
      size: opts.size || 22,
      bold: opts.bold || false,
      color: opts.color || "333333",
      italics: opts.italics || false,
    }));
  } else if (Array.isArray(text)) {
    text.forEach(t => {
      if (typeof t === 'string') {
        runs.push(new TextRun({ text: t, font: FONT_BODY, size: 22, color: "333333" }));
      } else {
        runs.push(new TextRun({
          text: t.text,
          font: t.font || FONT_BODY,
          size: t.size || 22,
          bold: t.bold || false,
          color: t.color || "333333",
          italics: t.italics || false,
        }));
      }
    });
  }
  return new Paragraph({
    children: runs,
    spacing: { after: opts.afterSpacing || 120, before: opts.beforeSpacing || 0, line: 360 },
    alignment: opts.alignment || AlignmentType.JUSTIFIED,
    indent: opts.indent ? { firstLine: 440 } : undefined,
  });
}

function bulletItem(text, ref = "bullets", level = 0) {
  const runs = [];
  if (typeof text === 'string') {
    runs.push(new TextRun({ text, font: FONT_BODY, size: 22, color: "333333" }));
  } else if (Array.isArray(text)) {
    text.forEach(t => {
      if (typeof t === 'string') {
        runs.push(new TextRun({ text: t, font: FONT_BODY, size: 22, color: "333333" }));
      } else {
        runs.push(new TextRun({
          text: t.text,
          font: t.font || FONT_BODY,
          size: t.size || 22,
          bold: t.bold || false,
          color: t.color || "333333",
        }));
      }
    });
  }
  return new Paragraph({
    numbering: { reference: ref, level },
    children: runs,
    spacing: { after: 60, line: 340 },
  });
}

function createTable(headers, rows, colWidths) {
  const border = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
  const borders = { top: border, bottom: border, left: border, right: border };

  const headerRow = new TableRow({
    children: headers.map((h, i) => new TableCell({
      borders,
      width: { size: colWidths[i], type: WidthType.DXA },
      shading: { fill: LIGHT_BLUE, type: ShadingType.CLEAR },
      margins: { top: 60, bottom: 60, left: 100, right: 100 },
      verticalAlign: "center",
      children: [new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: h, font: FONT_HEADING, size: 20, bold: true, color: BLUE })]
      })]
    }))
  });

  const dataRows = rows.map(row => new TableRow({
    children: row.map((cell, i) => new TableCell({
      borders,
      width: { size: colWidths[i], type: WidthType.DXA },
      margins: { top: 50, bottom: 50, left: 100, right: 100 },
      children: [new Paragraph({
        children: [new TextRun({ text: String(cell), font: FONT_BODY, size: 20, color: "333333" })]
      })]
    }))
  }));

  return new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: colWidths,
    rows: [headerRow, ...dataRows],
  });
}

function emptyLine() {
  return new Paragraph({ children: [], spacing: { after: 60 } });
}

function pageBreak() {
  return new Paragraph({ children: [new PageBreak()] });
}

// ============================================================
// Build Document Content
// ============================================================

const cover = [
  emptyLine(), emptyLine(), emptyLine(), emptyLine(), emptyLine(), emptyLine(), emptyLine(), emptyLine(),

  // Title
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 },
    children: [new TextRun({
      text: "揽盛电气AI智能体平台",
      font: FONT_HEADING,
      size: 56,
      bold: true,
      color: BLUE,
    })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 400 },
    children: [new TextRun({
      text: "2026年中工作汇报",
      font: FONT_HEADING,
      size: 48,
      bold: true,
      color: BLUE,
    })],
  }),

  // Divider line
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 400 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: MID_BLUE, space: 1 } },
    children: [],
  }),

  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 80 },
    children: [new TextRun({
      text: "CowAgent 智能体平台开发成果回顾",
      font: FONT_HEADING,
      size: 28,
      color: "555555",
    })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 80 },
    children: [new TextRun({
      text: "（2026年1月 — 2026年7月）",
      font: FONT_HEADING,
      size: 24,
      color: "888888",
    })],
  }),

  emptyLine(), emptyLine(), emptyLine(),

  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 120 },
    children: [new TextRun({ text: "汇报人：许松誉", font: FONT_BODY, size: 26, color: "333333" })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 120 },
    children: [new TextRun({ text: "部　门：营销中心 / 华南大区", font: FONT_BODY, size: 26, color: "333333" })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 120 },
    children: [new TextRun({ text: "日　期：2026年7月", font: FONT_BODY, size: 26, color: "333333" })],
  }),

  pageBreak(),
];

const tocSection = [
  heading1("目  录"),
  new TableOfContents("目录", { hyperlink: true, headingStyleRange: "1-3" }),
  pageBreak(),
];

// ========================================================================
// Chapter 1: Project Background (扩展版)
// ========================================================================
const chapter1 = [
  heading1("一、项目背景与职责定位"),

  heading2("1.1 项目背景"),
  para("CowAgent（原 chatgpt-on-wechat v2.1.2，2026年6月发布）是一款开源的超级AI助手平台。该平台具备任务规划与执行、多层记忆架构、知识库管理与自动索引、自我进化、多渠道消息接入、技能与工具系统等核心能力。2026年上半年，基于该项目进行了深度的企业定制化开发，将其打造为揽盛电气内部统一AI智能体平台，通过企业微信渠道服务于全公司员工。", { indent: true }),
  para("项目采用模块化分层架构，自底向上分为AI模型层（支持15+供应商）、Agent核心层（任务规划/记忆/知识/工具/技能）、插件系统层（事件驱动扩展）、渠道接入层（14种消息渠道）和Web控制台层（12个管理视图）。部署在公司服务器上，对接DeepSeek V4 Flash大模型，启用Agent模式（最大40步任务分解），开启自我进化功能。", { indent: true }),

  heading2("1.2 技术栈概览"),
  createTable(
    ["层级", "技术选型", "详细说明"],
    [
      ["AI模型", "DeepSeek V4 Flash", "Agent智能体推理核心，支持40步任务分解与工具调用"],
      ["企微渠道", "企微自建应用 + 机器人双通道", "wechatcom_app（HTTP回调）+ wecom_bot（WebSocket长连接/Webhook）"],
      ["其他渠道", "微信/飞书/钉钉/QQ/Telegram/Slack等", "14种消息渠道可选并用"],
      ["后端引擎", "Python / web.py / Flask", "异步消息引擎，多线程并发处理"],
      ["Web前端", "原生HTML/JS/CSS + SSE流式", "12视图，SSE流式输出"],
      ["ERP集成", "金蝶云星空 MCP Server", "MCP协议实现业务数据查询"],
      ["语音服务", "腾讯云ASR", "语音识别与文字转写"],
      ["浏览器", "Playwright + CDP协议", "14种浏览器操作，多标签页"],
      ["数据存储", "SQLite + FTS5 + 向量数据库", "记忆/知识/配置持久化"],
      ["定时调度", "croniter + 后台扫描线程", "cron/interval/once三种调度模式"],
    ],
    [2000, 3500, 3526]
  ),
  emptyLine(),

  heading2("1.3 职责定位"),
  para("作为本项目的主要开发者，本人负责CowAgent平台在揽盛电气的整体技术落地与定制开发工作。主要职责包括：", { indent: true }),
  bulletItem(["企业微信渠道深度集成：企微自建应用 + 机器人双通道对接"]),
  bulletItem(["金蝶云ERP业务集成：基于MCP协议对接企业ERP系统，开发金蝶查询Skill"]),
  bulletItem(["Web管理控制台开发：12个功能视图全栈开发（前后端）"]),
  bulletItem(["定时任务与Agent转发机制：定时调度 + 跨用户消息分发"]),
  bulletItem(["权限管理体系：用户/知识库/金蝶三级权限控制"]),
  bulletItem(["项目管理功能：Excel导入、智能分析、停滞预警"]),
  bulletItem(["开源协同：持续同步上游主线代码，保留自定义功能"]),

  pageBreak(),
];

// ========================================================================
// Chapter 2: Work Results (核心章节，详细展开)
// ========================================================================
const chapter2 = [
  heading1("二、上半年工作成果"),

  // ============================================================
  // 2.1 企业微信深度集成
  // ============================================================
  heading2("2.1 企业微信深度集成"),
  para("企业微信是公司内部沟通的核心工具。上半年完成了与企微的全链路深度对接，打通了AI助手与所有员工的交互通道。实现了企微自建应用（wechatcom_app）和企业微信机器人（wecom_bot）双渠道并行运行，互不干扰，系统运行稳定可靠。", { indent: true }),

  heading3("2.1.1 用户身份识别与映射"),
  para("建立了完整的企微用户自动识别与映射机制。通过企微通讯录API自动同步企业组织结构，建立48人的企业内部用户映射表，支持中文姓名到UserID的自动解析。用户映射采用内存+文件双重缓存策略，24小时自动过期刷新，有效降低API调用频率，提升响应速度。", { indent: true }),

  heading3("2.1.2 消息与文件收发（自建应用通道）"),
  para("完成企微自建应用的双向消息收发能力，HTTP回调模式，路由为 /wxcomapp/。支持文本、图片、文件、语音等多种消息类型。关键实现：", { indent: true }),
  bulletItem(["文本回复分片：长文本自动分割为多个消息分段发送"]),
  bulletItem(["语音回复自动转码：非AMR格式自动转换为AMR格式，超过60秒自动分割"]),
  bulletItem(["图片回复：支持IMAGE_URL（下载后上传）和IMAGE（直接上传）两种模式"]),
  bulletItem(["文件发送：支持多文件批量传输，修复了发送多个文件时的兼容性Bug"]),
  bulletItem(["Access Token自动刷新：后台线程每60秒检查，提前10分钟自动刷新"]),
  emptyLine(),

  heading3("2.1.3 消息与文件收发（机器人通道）"),
  para("完成企业微信机器人通道的全功能对接。支持WebSocket长连接（默认，wss://openws.work.weixin.qq.com）和Webhook HTTP回调两种传输模式，可灵活切换。", { indent: true }),
  bulletItem(["WebSocket模式：长连接保持，自动重连机制，流式回复每100ms推送增量"]),
  bulletItem(["Webhook模式：通过 /wecombot 路径接收加密回调，AES-256-CBC加解密"]),
  bulletItem(["图片发送：自动下载图片→格式转换（JPG/PNG）→压缩至512KB内→分片上传media_id"]),
  bulletItem(["文件发送：三步分片上传协议（init→chunk→finish）"]),
  bulletItem(["语音发送：自动转AMR格式后上传发送"]),
  bulletItem(["消息类型支持：text/voice/image/mixed(图文混合)/file/video"]),
  bulletItem(["流式状态管理：支持消息流状态的创建和轮询刷新"]),
  emptyLine(),

  heading3("2.1.4 腾讯云ASR语音识别"),
  para("集成腾讯云语音识别（ASR）服务，用户可直接发送语音消息。从企微下载语音文件后，系统自动调用腾讯云ASR接口将语音转写为文字，交由AI智能体处理。同时支持Web页面麦克风录音→ASR识别的端到端语音输入流程，大幅降低了输入门槛，特别提升了移动端用户的使用体验。", { indent: true }),

  heading3("2.1.5 Agent企微消息发送工具"),
  para("开发了两个企微专用的Agent工具：", { indent: true }),
  bulletItem([{ text: "wecom_app_send", font: FONT_CODE, size: 20, color: MID_BLUE }, " — Agent在推理过程中通过企微自建应用主动发送消息/文件给指定的用户或群聊。支持中文姓名到UserID的自动解析。发送后自动将消息注入接收者的AI Session上下文，保持跨用户的对话连续性。"]),
  bulletItem([{ text: "wecom_webhook_send", font: FONT_CODE, size: 20, color: MID_BLUE }, " — Agent通过企微机器人Webhook发送消息到群聊。支持text/markdown/image/news四种消息类型。从config.json读取Webhook URL列表，支持多个Webhook并行发送，结果汇总反馈。"]),
  emptyLine(),

  heading3("2.1.6 群聊Webhook推送"),
  para("实现了群聊消息的实时Webhook推送功能。当群聊中有消息时，Agent通道可以通过配置的Webhook URL将消息推送至外部业务系统，打通了AI助手与企业其他系统的消息通知链路，实现了跨系统的信息协同。", { indent: true }),

  createTable(
    ["功能模块", "技术方案", "关键指标", "状态"],
    [
      ["用户身份识别", "企微通讯录API + 映射缓存", "48用户，24h缓存刷新", "✔ 已上线"],
      ["文本消息收发", "企微自建应用API / WebSocket", "双通道并行", "✔ 已上线"],
      ["文件/图片发送", "三步分片上传协议", "支持多文件批量", "✔ 已上线"],
      ["语音输入处理", "腾讯云ASR + 语音文件下载", "自动转写", "✔ 已上线"],
      ["Agent消息发送工具", "wecom_app_send / wecom_webhook_send", "2个专用工具", "✔ 已上线"],
      ["群聊Webhook推送", "企微机器人Webhook", "多目标并行推送", "✔ 已上线"],
      ["AES加密通信", "AES-256-CBC", "Webhook模式加密", "✔ 已上线"],
    ],
    [2200, 2800, 2500, 1526]
  ),
  emptyLine(),

  // ============================================================
  // 2.2 金蝶云ERP集成
  // ============================================================
  heading2("2.2 金蝶云ERP集成"),
  para("金蝶云星空是公司的核心ERP系统，涵盖销售、采购、库存、财务等核心业务模块。上半年基于MCP（Model Context Protocol）协议完成了与金蝶的深度对接，将ERP数据查询能力赋予AI助手，实现了自然语言驱动的业务数据查询。", { indent: true }),

  heading3("2.2.1 金蝶查询Skill"),
  para("开发了kingdee-query技能，通过MCP Server与金蝶云星空交互。技能内置8个参考文档，覆盖各类业务场景的最佳查询实践：", { indent: true }),
  bulletItem(["销售订单查询：支持按日期范围、客户、物料、状态等多维度筛选"]),
  bulletItem(["采购订单查询：支持供应商、物料、到货状态等条件"]),
  bulletItem(["销售出库单（SAL_OUTSTOCK）：发货进度跟踪"]),
  bulletItem(["物料档案（BD_MATERIAL）：物料信息查询与规格确认"]),
  bulletItem(["库存查询（STK_Inventory）：实时库存量与在途查询"]),
  bulletItem(["客户档案：客户基本信息、信用额度、账期等"]),
  bulletItem(["应收账款：逾期账款分析、账龄统计"]),
  bulletItem(["经营日报：每日核心业务数据汇总"]),
  emptyLine(),

  heading3("2.2.2 MCP协议对接架构"),
  para("采用MCP协议作为金蝶集成的标准协议，通过MCP Server动态注册工具。Agent通过调用 query_bill_json（查询单据）、view_bill（查看详情）、count_bill（统计计数）、query_metadata（元数据查询）四个MCP工具与金蝶交互。MCP支持stdio和sse两种连接方式，后台异步加载，支持热更新无需重启服务。", { indent: true }),

  heading3("2.2.3 大数据量分片查询策略"),
  para("针对金蝶ERP大数据量查询场景，设计了分片查询策略。通过日期范围自动分区、分批拉取（每片10万行）、结果聚合的流水线处理，有效解决了单次查询数据量过大的问题，确保查询响应速度和系统稳定性。", { indent: true }),

  heading3("2.2.4 金蝶看板系统"),
  para("在Web控制台中开发了金蝶看板功能。支持看板视图（卡片式）、表格视图、饼图、柱图、折线图5种数据可视化方式。提供 /api/kingdee/kanban 和 /api/kingdee/bill-detail 两个专用API，方便管理层直观了解销售订单、审批流转、库存、应收款等核心业务数据的实时状态。", { indent: true }),

  createTable(
    ["功能模块", "技术实现", "状态"],
    [
      ["kingdee-query Skill", "MCP协议 + 8个参考文档", "✔ 已上线"],
      ["MCP Server", "stdio/sse双模式，热更新", "✔ 已上线"],
      ["分片查询", "日期分区+分批拉取+聚合", "✔ 已上线"],
      ["金蝶看板（5种视图）", "Web控制台可视化", "✔ 已上线"],
      ["7+业务单据查询", "自然语言驱动", "✔ 已上线"],
      ["经营日报", "自动汇总每日业务数据", "✔ 已上线"],
    ],
    [2600, 3500, 2926]
  ),
  emptyLine(),

  // ============================================================
  // 2.3 项目管理功能
  // ============================================================
  heading2("2.3 项目管理功能"),
  para("为满足公司内部项目跟踪和进度管理的需求，在Web控制台中开发了完整的项目管理模块。支持从Excel文件导入到智能分析的完整流程。", { indent: true }),

  heading3("2.3.1 核心功能"),
  bulletItem(["Excel项目文件上传：支持拖拽和点击上传，.xlsx格式，限制10MB，含上传进度动画"]),
  bulletItem(["智能列识别：通过关键词匹配算法自动识别5种列类型（项目名称/进度/负责人/更新日期/状态）"]),
  bulletItem(["复杂Excel兼容：支持多级合并表头处理，兼容7+种日期格式（标准日期 / M.dd / Excel序列号 / 中文「X月X号」等）"]),
  bulletItem(["停滞项目预警：自动检测超过30天未更新且未完成的项目，红色警示框突出显示，含停滞天数计数和进度条"]),
  bulletItem(["统计分析看板：项目总数、停滞项目数、项目健康率三个统计卡片一目了然"]),
  bulletItem(["进度条可视化：颜色编码的进度条（低/中/高/完成）直观展示各项目状态"]),
  bulletItem(["双语言界面：完整中英文国际化（20+条i18n文案），适配国际化使用场景"]),
  emptyLine(),

  heading3("2.3.2 技术实现"),
  para("后端（ProjectAnalyzeHandler，约240行代码）：基于openpyxl解析Excel文件，支持多级表头合并单元格检测。通过智能列名匹配算法（关键词权重评分）自动识别项目名称、进度、负责人、更新日期、状态5种关键列类型。日期格式兼容包含strptime标准格式、Excel序列号数值、中文文本格式等。返回JSON响应，包含column_mapping和完整数据行。", { indent: true }),
  para("前端：原生JS实现拖拽上传区域（含拖拽高亮效果）、实时渲染统计卡片（项目数/停滞数/健康率）、动态数据表格和停滞项目预警列表。完整的中英文切换支持。", { indent: true }),

  createTable(
    ["功能点", "技术实现", "用户价值"],
    [
      ["智能列识别", "关键词权重匹配（5种列类型）", "无需手动映射，开箱即用"],
      ["停滞检测", ">30天未更新 + 未完成判定", "及时预警，避免项目延误"],
      ["多日期格式", "7+种日期格式兼容解析", "兼容各类Excel数据源"],
      ["多级表头处理", "openpyxl合并单元格检测", "支持复杂格式的导入文件"],
      ["双语言界面", "中英文i18n（20+条文案）", "适配国际化使用场景"],
      ["统计看板", "3个统计卡片实时计算", "一目了然的项目全局视图"],
    ],
    [1800, 3500, 3726]
  ),
  emptyLine(),

  // ============================================================
  // 2.4 Web管理控制台全面升级
  // ============================================================
  heading2("2.4 Web管理控制台全面升级"),
  para("上半年前端开发中最重要的工作之一是Web管理控制台的全面重构和功能扩展。从基础的对话界面扩展为包含12个功能视图、48个REST API的综合管理平台，前后端代码超过3500行。", { indent: true }),

  heading3("2.4.1 12个功能视图详解"),
  para("控制台侧边栏按功能分组组织：对话分组（对话）、管理分组（配置/模型/技能/记忆/知识/通道/定时/权限/日志）、应用分组（看板/项目）。各视图功能如下：", { indent: true }),

  createTable(
    ["视图", "API路由", "功能描述", "开发类型"],
    [
      ["对话", "/chat + /stream + /poll", "AI对话交互界面，SSE流式输出，历史会话管理", "优化升级"],
      ["配置", "/config (GET/POST)", "系统运行参数可视化配置", "优化升级"],
      ["模型", "/api/models (GET/POST/DELETE)", "8种模型能力统一管理，多厂商凭据配置", "全新开发"],
      ["技能", "/api/skills (GET/POST)", "已安装技能列表、启用/禁用管理", "全新开发"],
      ["记忆", "/api/memory (GET)", "记忆文件列表（分页）、内容查看", "全新开发"],
      ["知识", "/api/knowledge/* (5个API)", "知识库文件树、文档CRUD、知识图谱、文档导入", "全新开发"],
      ["通道", "/api/channels (GET/POST)", "消息渠道启停管理、状态监控", "全新开发"],
      ["定时", "/api/scheduler/* (4个API)", "定时任务列表、创建、启停、删除", "全新开发"],
      ["权限", "/api/permissions/* (5个API)", "用户/知识库/金蝶三级权限 + 审计日志", "全新开发（核心创新）"],
      ["日志", "/api/logs (SSE)", "实时日志流（tail -f run.log）", "全新开发"],
      ["看板", "/api/kingdee/kanban + bill-detail", "金蝶业务数据5种可视化视图", "全新开发"],
      ["项目", "/api/projects/analyze (POST)", "Excel项目文件上传分析与停滞预警", "全新开发"],
    ],
    [1200, 3000, 4026, 800]
  ),
  emptyLine(),

  heading3("2.4.2 权限管理系统（核心创新）"),
  para("开发了完整的权限管理体系，是本次工作中最具创新价值的核心功能之一，包含5个专用API：", { indent: true }),
  bulletItem(["用户管理（/api/permissions/users）：同步企微48名用户到权限系统，支持按部门和角色管理"]),
  bulletItem(["权限配置（/api/permissions/config）：读写权限配置文件，支持用户对知识库/金蝶/文件夹的三级精细权限控制"]),
  bulletItem(["文件夹管理（/api/permissions/folders）：获取知识库文件夹树状结构，支持按文件夹授权"]),
  bulletItem(["用户同步（/api/permissions/sync-users）：从企业微信通讯录API自动同步用户到权限系统"]),
  bulletItem(["审计日志（/api/permissions/audit-log）：记录所有权限变更操作，支持时间范围和用户筛选追溯"]),
  para("权限配置数据持久化为JSON文件，支持热加载。知识库权限按文档分类控制，金蝶权限按功能模块控制，文件夹权限按目录树控制，三种权限独立配置、灵活组合。", { indent: true }),
  emptyLine(),

  heading3("2.4.3 模型管理系统"),
  para("开发了统一的模型管理界面，集中管理AI平台的8种模型能力：主对话模型、图像理解模型、图像生成模型、语音识别（ASR）模型、语音合成（TTS）模型、向量嵌入模型、联网搜索模型、推理模型。", { indent: true }),
  para("支持多模型供应商（DeepSeek/OpenAI/Gemini/通义千问/豆包/智谱等15+家）凭据的集中配置。后端通过 /api/models 的GET/POST/DELETE操作实现模型配置的CRUD，支持多厂商凭据管理和自动策略切换。", { indent: true }),

  heading3("2.4.4 对话系统核心功能"),
  para("Web对话界面提供了完整的交互体验，后端对应15个API：", { indent: true }),
  bulletItem(["消息发送（/message, POST）：支持文本、图片、语音、文件等多类型消息"]),
  bulletItem(["SSE流式响应（/stream, GET）：实时流式输出AI回复"]),
  bulletItem(["消息轮询（/poll, POST）：获取已缓存的消息响应"]),
  bulletItem(["任务取消（/cancel, POST）：中断正在执行的Agent任务"]),
  bulletItem(["文件上传（/upload, POST）：上传附件供AI处理"]),
  bulletItem(["会话管理：列表查询（/api/sessions GET）、自动生成标题、清除上下文、删除/重命名"]),
  bulletItem(["历史消息（/api/history, GET）：按会话查询历史对话"]),
  bulletItem(["语音输入（/api/voice/asr, POST）：浏览器端录音转文字"]),
  bulletItem(["语音输出（/api/voice/tts, POST）：文字转语音播放"]),
  bulletItem(["登录认证：登录（/auth/login）、检查（/auth/check）、登出（/auth/logout）"]),
  emptyLine(),

  // ============================================================
  // 2.5 智能体核心能力增强
  // ============================================================
  heading2("2.5 智能体核心能力增强"),

  heading3("2.5.1 定时任务系统"),
  para("开发了完整的定时任务系统，包含调度工具（SchedulerTool）、调度服务（SchedulerService）、任务存储（TaskStore）和Agent桥接（Integration）四个组件。", { indent: true }),
  bulletItem(["三种调度类型：once（一次性定时）、interval（固定间隔，如每2小时）、cron（标准Cron表达式）"]),
  bulletItem(["四种任务动作：发送消息、Agent任务执行、工具调用、技能调用"]),
  bulletItem(["后台扫描线程：每30秒检查一次到期任务，支持启用/禁用单个任务"]),
  bulletItem(["任务持久化：JSON格式存储，支持列表查询、创建、更新、删除、启禁"]),
  bulletItem(["croniter库解析：兼容标准Linux Cron表达式"]),
  emptyLine(),

  heading3("2.5.2 Agent智能转发与上下文同步"),
  para("实现Agent转发机制，支持跨用户的消息转发和上下文注入。当Agent使用 wecom_app_send 工具发送消息给其他用户时，消息内容会自动注入到接收者的AI Session上下文中，保持对话的连续性和一致性。接收者可以自然地在上文基础上继续提问，无需重新描述背景信息。", { indent: true }),

  heading3("2.5.3 浏览器多标签页支持"),
  para("扩展了浏览器自动化工具（BrowserTool/BrowserService）的标签页管理能力，基于Playwright实现：", { indent: true }),
  bulletItem(["14种浏览器操作：navigate/snapshot/click/fill/select/scroll/screenshot/wait/back/forward/get_text/press/evaluate/js执行"]),
  bulletItem(["多标签页管理：list_pages（列出所有标签页）、switch_page（切换标签页），支持同时管理多个页面"]),
  bulletItem(["三种启动模式：persistent（持久化用户数据目录）、cdp（Chrome DevTools Protocol连接外部浏览器）、fresh（每次新上下文）"]),
  bulletItem(["安全防护：内置SSRF防护，阻止访问内网IP/链接本地地址/云元数据端点"]),
  bulletItem(["自动空闲超时关闭：节省系统资源"]),
  emptyLine(),

  heading3("2.5.4 Agent工具系统完整列表"),
  para("Agent工具系统包含18个工具子目录，Agent可根据任务需要动态调用：", { indent: true }),

  createTable(
    ["工具名称", "功能描述", "使用场景"],
    [
      ["read", "文件读取", "读取项目文件、配置文件"],
      ["write", "文件写入", "创建/更新文件内容"],
      ["edit", "文件编辑（查找替换）", "精确修改文件特定部分"],
      ["bash", "Shell命令执行", "运行脚本、程序编译等"],
      ["ls", "文件列表", "浏览目录结构"],
      ["send", "消息发送给其他用户", "跨用户消息分发"],
      ["scheduler", "定时任务管理", "创建/管理定时任务"],
      ["browser", "浏览器自动化", "Web页面操作和数据抓取"],
      ["web_fetch", "网页内容抓取", "获取网页内容"],
      ["web_search", "网络搜索", "联网搜索信息"],
      ["vision", "图像识别", "图片内容分析"],
      ["memory_search", "记忆搜索", "查询长期记忆"],
      ["memory_get", "记忆获取", "读取特定记忆内容"],
      ["mcp_tools", "MCP协议工具", "对接外部系统（金蝶等）"],
      ["wecom_app_send", "企微应用消息发送", "主动推送消息到企微"],
      ["wecom_webhook_send", "企微Webhook推送", "群聊消息推送"],
      ["evolution_undo", "进化回滚", "撤销自我进化操作"],
      ["env_config", "环境变量管理", "管理运行时环境配置"],
    ],
    [2400, 2000, 4626]
  ),
  emptyLine(),

  heading3("2.5.5 多渠道并行运行"),
  para("实现企微自建应用（wechatcom_app）和企业微信机器人（wecom_bot）双渠道同时在线。系统支持动态添加/移除/重启渠道，通过Channel Factory统一管理（channel/channel_factory.py）。各渠道独立运行、互不干扰，一个渠道的故障不会影响其他渠道的正常服务。", { indent: true }),

  emptyLine(),

  // ============================================================
  // 2.6 多模态能力建设
  // ============================================================
  heading2("2.6 多模态能力建设"),
  para("为AI助手配备了丰富的多模态交互能力，涵盖图像、语音、视觉三大领域，支持多供应商自动路由：", { indent: true }),

  heading3("2.6.1 图像生成系统"),
  para("开发了图像生成技能（image-generation SKILL.md + generate.py，45KB代码），统一封装6家供应商的图像生成API：", { indent: true }),
  bulletItem(["OpenAI：gpt-image-2, gpt-image-1"]),
  bulletItem(["Google Gemini：nano-banana-2, nano-banana-pro"]),
  bulletItem(["火山引擎Seedream：seedream-5.0-lite, seedream-4.5"]),
  bulletItem(["阿里通义千问：qwen-image-2.0, qwen-image-2.0-pro"]),
  bulletItem(["MiniMax：image-01"]),
  bulletItem(["LinkAI：通用代理转发"]),
  para("支持文生图（text-to-image）和图生图（image-to-image）两种模式。系统自动根据可用配置选择合适的供应商，无需用户手动指定。支持图片尺寸配置和base64编码输出。", { indent: true }),
  emptyLine(),

  heading3("2.6.2 图像理解能力"),
  para("通过Vision工具（agent/tools/vision/）支持图片分析和描述。Agent可以将用户发送的图片传递给视觉模型，实现图片内容识别、文字提取、场景描述等智能理解能力。支持多种视觉模型供应商自动切换。", { indent: true }),

  heading3("2.6.3 语音交互全链路"),
  para("语音交互能力覆盖输入→识别→处理→合成的全链路：", { indent: true }),
  bulletItem(["语音输入：浏览器端麦克风录音 → /api/voice/asr → 腾讯云ASR → 文字 → AI处理"]),
  bulletItem(["语音合成：AI回复文字 → /api/voice/tts → 语音文件 → 浏览器播放"]),
  bulletItem(["企微语音消息：用户发语音 → 下载语音文件 → 腾讯云ASR转写 → AI处理回复"]),
  bulletItem(["语音格式转换：audio_convert模块支持任意音频格式转AMR（适配企微），含60秒自动分割"]),
  emptyLine(),

  // ============================================================
  // 2.7 自我进化与知识沉淀
  // ============================================================
  heading2("2.7 自我进化与知识沉淀"),

  heading3("2.7.1 自我进化系统"),
  para("自我进化是CowAgent平台最先进的AI能力之一。它使AI能够自动回顾对话历史，识别自我优化机会，持续改进服务质量。完整流程如下：", { indent: true }),
  bulletItem(["空闲扫描：后台线程每60秒扫描所有会话，检测空闲（默认10分钟无操作）"]),
  bulletItem(["触发条件：空闲>=idle_minutes 且 用户轮次>=6次，或上下文压力>80%"]),
  bulletItem(["会话转录：构建完整会话转录本（含所有消息和AI推理过程）"]),
  bulletItem(["快照备份：自动备份MEMORY.md + 每日记忆文件 + 技能文件，支持一键回滚"]),
  bulletItem(["隔离执行：在受限沙箱中运行进化Agent（仅限read/memory_search工具），确保安全"]),
  bulletItem(["4种进化信号检测：技能优化建议、未完成任务跟进、长期记忆修正、知识库更新"]),
  bulletItem(["进化记录：所有进化操作写入日志，支持追溯和审计"]),
  bulletItem(["无变化则输出 [SILENT]，不打扰用户"]),
  emptyLine(),

  heading3("2.7.2 知识库Wiki系统"),
  para("知识库系统（KnowledgeService, 28KB代码）支持企业知识的持久化积累。基于工作区目录下的 knowledge/ 目录组织：", { indent: true }),
  bulletItem(["文件布局：index.md（索引）+ log.md（变更日志）+ <分类>/<文档名>.md"]),
  bulletItem(["文档管理：创建、读取、更新、删除、批量删除，支持分类目录管理"]),
  bulletItem(["知识图谱：/api/knowledge/graph 提供知识关联图谱数据"]),
  bulletItem(["文档导入：/api/knowledge/import 支持导入文档到知识库"]),
  bulletItem(["自动索引：知识文件变更后自动同步到MemoryManager的向量索引"]),
  bulletItem(["知识维基管理Skill（knowledge-wiki）：持续自动整理对话中的知识点，支持ingest/synthesize/query三个操作"]),
  emptyLine(),

  heading3("2.7.3 三层记忆架构"),
  para("实现了完整的长期记忆系统（MemoryManager, 21KB代码）：", { indent: true }),
  bulletItem(["短期上下文记忆：当前对话窗口内的消息历史（Session上下文）"]),
  bulletItem(["每日记忆文件：每次对话结束后自动总结关键信息，写入每日文件"]),
  bulletItem(["核心长期记忆：通过MemoryFlushManager（Deep Dream蒸馏算法）定期提取核心知识，持久化存储"]),
  bulletItem(["向量检索：支持混合搜索（向量+关键词FTS5全文索引），中文/日文/韩文CJK分词优化"]),
  bulletItem(["多种Embedding供应商：OpenAI / 豆包Doubao，带缓存加速"]),
  bulletItem(["SQLite+FTS5存储层：MemoryStorage类（43KB代码），支持高性能全文检索和向量相似度搜索"]),
  bulletItem(["ConversationStore（50KB代码）：完整的对话历史持久化，sessions + messages双表设计"]),
  bulletItem(["重建索引：支持向量索引的在线重建和维度检测"]),
  emptyLine(),

  // ============================================================
  // 2.8 插件与技能系统
  // ============================================================
  heading2("2.8 插件与技能系统"),

  heading3("2.8.1 插件系统"),
  para("平台内置插件系统，通过事件驱动机制扩展功能。插件管理器（PluginManager）支持按优先级排序、启用/禁用、远程源安装。主要内置插件包括：", { indent: true }),
  bulletItem(["godcmd：管理员指令，支持21KB的命令集，用于系统管理和运维操作"]),
  bulletItem(["keyword：关键词匹配自动回复，基于配置的关键词规则触发"]),
  bulletItem(["banwords：敏感词过滤，保护信息安全"]),
  bulletItem(["finish：未知命令智能引导处理"]),
  bulletItem(["hello：新用户欢迎/示例交互"]),
  bulletItem(["cow_cli：命令行指令拦截处理（77KB）"]),
  bulletItem(["dungeon：文字冒险游戏，趣味性互动"]),
  bulletItem(["linkai：LinkAI智能平台集成，含Midjourney画图支持"]),
  emptyLine(),

  heading3("2.8.2 技能系统（Skills）"),
  para("技能系统提供模块化的领域能力扩展。每个技能包含SKILL.md定义文件和可选的参考文档/脚本。内置4个核心技能：", { indent: true }),
  bulletItem(["kingdee-query：金蝶云ERP查询（上文已详述）"]),
  bulletItem(["image-generation：多供应商图像生成（上文已详述）"]),
  bulletItem(["knowledge-wiki：知识维基持续管理（始终加载）"]),
  bulletItem(["skill-creator：动态创建/安装/更新技能"]),
  emptyLine(),

  // ============================================================
  // 2.9 模型管理
  // ============================================================
  heading2("2.9 AI模型适配层"),
  para("平台通过模型适配层（models/目录，42个文件）支持15+家AI模型供应商的热切换：", { indent: true }),
  bulletItem(["DeepSeek / OpenAI / ChatGPT / Claude / Gemini"]),
  bulletItem(["阿里通义千问（DashScope）/ 百度文心一言 / 字节豆包"]),
  bulletItem(["智谱AI / 讯飞星火 / MiniMax / Moonshot / ModelScope"]),
  bulletItem(["百度千帆 / LinkAI / Mimo / 自定义OpenAI兼容供应商"]),
  bulletItem(["BotFactory工厂模式：按配置自动创建对应Bot实例"]),
  bulletItem(["OpenAICompatibleBase：通用工具调用实现，子类只需覆盖get_api_config()"]),
  bulletItem(["SessionManager：会话管理，维护对话的上文文脉"]),
  para("通过Web控制台的模型管理视图，可以可视化配置各厂商的API Key、端点地址、模型名称，无需修改代码或重启服务。", { indent: true }),

  emptyLine(),

  // ============================================================
  // 2.10 开源协同
  // ============================================================
  heading2("2.10 开源社区协作"),
  para("在开发过程中，持续同步上游主线（zhayujie/chatgpt-on-wechat）的最新代码。通过多次合入上游提交，在保留所有自定义功能（用户身份识别、企微自建应用集成等）的同时，持续吸收了社区的前沿改进和Bug修复，确保平台紧跟开源社区的最新发展。", { indent: true }),

  pageBreak(),
];

// ========================================================================
// Chapter 3: Technical Architecture (扩展版)
// ========================================================================
const chapter3 = [
  heading1("三、技术架构与核心设计"),

  heading2("3.1 系统架构总览"),
  para("CowAgent平台采用模块化分层架构设计，各层职责清晰、解耦独立：", { indent: true }),

  createTable(
    ["层级", "核心组件", "职责说明"],
    [
      ["AI模型层", "DeepSeek / 15+模型适配器", "提供模型推理、多模态处理、工具调用能力"],
      ["Agent核心层", "Agent协议/任务规划/记忆/知识/技能/工具", "核心智能引擎，任务分解与执行"],
      ["插件与技能层", "PluginManager + SkillManager + MCP工具", "功能扩展和领域能力注入"],
      ["渠道接入层", "ChannelManager / 14种渠道适配器", "多渠道消息收发和格式统一"],
      ["Web控制台层", "12视图前端 + 48个REST API", "系统管理、监控、配置"],
      ["数据持久层", "SQLite+FTS5 / JSON / 向量数据库 / 文件系统", "记忆、知识、配置、日志持久化"],
    ],
    [2200, 3000, 3826]
  ),
  emptyLine(),

  heading2("3.2 消息处理核心流程"),
  para([{ text: "消息从用户到AI回复的完整链路：", bold: true }]),
  bulletItem(["用户 → 企微渠道 → WecomBotChannel/WechatComAppChannel → ChannelManager → Agent协议层"]),
  bulletItem(["Agent协议层 → 任务规划 → 模型推理（LLM）→ 工具调用（MCP/浏览器/记忆搜索等）→ 回复生成"]),
  bulletItem(["回复 → 渠道适配 → 格式转换（文本/图片/语音/文件）→ 发送回用户"]),
  para([{ text: "定时任务独立流程：", bold: true }]),
  bulletItem(["SchedulerService后台线程（30秒扫描）→ 任务到期 → AgentTool/消息推送执行 → 结果注入目标会话"]),
  para([{ text: "自我进化独立流程：", bold: true }]),
  bulletItem(["空闲检测线程（60秒扫描）→ 触发条件满足 → 会话转录 → 文件快照 → 隔离进化Agent → 变更写入 → 进化记录"]),
  emptyLine(),

  heading2("3.3 MCP协议集成架构"),
  para("MCP（Model Context Protocol）是本项目的关键集成标准，用于连接外部系统。核心实现包含McpTool和McpClientRegistry两个组件：", { indent: true }),
  bulletItem(["McpClientRegistry：全局单例，管理和注册所有MCP客户端连接"]),
  bulletItem(["McpTool：动态将MCP工具注册为Agent可用工具，支持自动发现工具列表"]),
  bulletItem(["支持stdio子进程和sse HTTP两种连接方式"]),
  bulletItem(["后台异步加载，支持热更新（新增工具无需重启服务）"]),
  bulletItem(["config.json中可配置多个MCP Server（mcp_servers/mcpServers配置项）"]),
  bulletItem(["ToolManager提供list_mcp_status()方法实时查看各MCP服务器状态"]),
  bulletItem(["金蝶云星空ERP查询即是通过MCP协议对接的典型应用场景"]),
  emptyLine(),

  heading2("3.4 安全与权限设计"),
  para("构建了多层安全防护体系，覆盖控制台访问、功能权限、工具安全和自我进化四个维度：", { indent: true }),
  bulletItem(["Web控制台认证：基于HMAC无状态令牌认证，密码可配置（config.json）"]),
  bulletItem(["权限管理系统：知识库/金蝶/文件夹三级权限控制 + 审计日志"]),
  bulletItem(["工具安全：浏览器SSRF防护（阻止内网/链接本地/云元数据）、文件路径逃逸检测"]),
  bulletItem(["自我进化安全：隔离沙箱执行环境 + 工作空间写入守卫 + 文件快照回滚机制"]),
  bulletItem(["企微渠道安全：AES-256-CBC通信加密，URL验证防篡改"]),
  emptyLine(),

  heading2("3.5 数据存储架构"),
  para([{ text: "SQLite数据库：", bold: true }, "记忆向量存储（MemoryStorage，含FTS5全文索引）、对话历史（ConversationStore，sessions + messages表）"]), 
  para([{ text: "JSON文件：", bold: true }, "权限配置（permission_config.json）、用户映射（wecom_name_mapping.json）、定时任务存储、技能配置"]), 
  para([{ text: "文件系统：", bold: true }, "知识库文档（knowledge/目录）、记忆文件（memory/目录）、工作区文件"]), 
  para([{ text: "向量数据库：", bold: true }, "嵌入向量索引（支持维度检测和在线重建）"]),

  pageBreak(),
];

// ========================================================================
// Chapter 4: Business Value
// ========================================================================
const chapter4 = [
  heading1("四、业务价值分析"),

  heading2("4.1 工作效率大幅提升"),
  para("通过AI智能体的多项能力，各业务场景效率得到显著提升：", { indent: true }),

  createTable(
    ["业务场景", "原有方式", "AI助手方式", "效率提升"],
    [
      ["订单查询", "登录金蝶 → 多级菜单筛选", "自然语言查订单", "60%+"],
      ["项目跟踪", "逐一打开Excel手动计算", "上传自动分析停滞/健康率", "80%+"],
      ["库存查询", "登录金蝶搜索物料编码", "自然语言查库存", "70%+"],
      ["客户资料查", "翻阅Excel或金蝶", "自然语言查客户档案", "60%+"],
      ["数据看板", "手动汇总统计数据", "金蝶看板5种可视化", "85%+"],
      ["消息推送", "手动编辑逐一发送", "定时任务自动推送", "接近100%"],
      ["文档查询", "翻阅知识库/Wiki", "AI直接检索问答", "70%+"],
      ["语音输入", "打字输入文字", "语音自动转文字", "50%+"],
      ["批量文件发", "逐一手动发送", "Agent自动批量发送", "90%+"],
    ],
    [2000, 3000, 3000, 1026]
  ),
  emptyLine(),

  heading2("4.2 全员AI赋能"),
  para("通过企业微信接入，AI助手服务覆盖公司48+员工。员工在企微中即可与AI自然对话交互，无需额外安装客户端或学习新系统。多模态能力（文生图、图理解、语音交互）让AI真正成为每个人的智能助手，降低了AI使用的技术门槛。支持中英文双语界面，适配不同使用习惯。", { indent: true }),
  para("Agent智能转发机制支持员工通过AI助手主动向其他同事发送消息和文件，消息自动注入接收者上下文，使得跨部门协作更加流畅。", { indent: true }),

  heading2("4.3 精细化管理赋能"),
  para("权限管理系统实现了对知识库、金蝶查询、文件夹的三级精细化管控，确保不同部门和角色的员工在授权范围内使用AI资源。审计日志功能让所有权限变更和操作可追溯，满足企业合规管理要求。", { indent: true }),
  para("通过项目管理模块，管理层可以快速了解项目全局状态，及时识别停滞项目并进行干预，实现了从「被动跟踪」到「主动预警」的管理模式转变。", { indent: true }),

  heading2("4.4 自动化任务降本"),
  para("定时任务系统实现了消息推送、Agent任务、工具调用的全自动化执行。通过 cron/interval/once 三种调度模式，可以灵活设置各种自动化场景：每日经营报告自动推送、定期库存预警、自动客户跟进提醒等，大幅减少人工重复操作。", { indent: true }),

  heading2("4.5 知识资产沉淀"),
  para("自我进化系统和知识库Wiki系统的结合，使AI能够在日常服务中自动沉淀企业知识。对话中的关键信息被自动总结、归类、索引，形成可持续积累的企业知识资产。新员工可以通过自然语言问答快速获取历史沉淀的业务知识。", { indent: true }),

  pageBreak(),
];

// ========================================================================
// Chapter 5: Future Plan
// ========================================================================
const chapter5 = [
  heading1("五、下半年规划展望"),

  heading2("5.1 重点方向"),
  bulletItem(["金蝶ERP集成深化：增加更多业务单据类型（采购入库、生产领料、财务凭证等），优化查询精度和响应速度，探索AI驱动的业务数据智能分析"]),
  bulletItem(["项目管理增强：增加项目进度自动跟踪、甘特图可视化、多项目对比分析、任务自动分配"]),
  bulletItem(["数据分析能力：基于金蝶和项目数据的智能报表和趋势预测，辅助管理层决策"]),
  bulletItem(["AI助手智能化提升：优化Agent的任务规划能力，提升复杂多步任务完成率，增强推理能力"]),
  bulletItem(["权限系统完善：细化权限粒度，增加角色管理、审批流程等企业级功能"]),
  bulletItem(["移动端体验优化：持续优化企业微信端的交互体验，丰富语音交互场景"]),
  bulletItem(["知识库深化：自动知识提取质量提升，知识图谱可视化，跨文档语义关联"]),
  emptyLine(),

  heading2("5.2 关键里程碑"),

  createTable(
    ["时间节点", "目标", "预期价值"],
    [
      ["2026年Q3", "金蝶更多业务模块接入", "覆盖财务、生产等更多业务线"],
      ["2026年Q3", "数据报表系统上线", "辅助管理层数据决策"],
      ["2026年Q3", "权限角色管理系统", "更精细的企业级权限控制"],
      ["2026年Q4", "项目管理系统2.0", "全流程项目跟踪和自动预警"],
      ["2026年Q4", "AI能力全面升级", "更自然的对话和更精准的任务执行"],
      ["2026年Q4", "知识图谱可视化", "直观的企业知识资产管理"],
    ],
    [2200, 3500, 3326]
  ),
  emptyLine(),

  // Closing
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 600, after: 200 },
    children: [new TextRun({ text: "以上是2026年上半年的工作汇报", font: FONT_HEADING, size: 28, color: BLUE })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 },
    children: [new TextRun({ text: "感谢聆听，敬请指正", font: FONT_HEADING, size: 28, color: MID_BLUE })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 },
    children: [new TextRun({ text: "许松誉 · 2026年7月", font: FONT_BODY, size: 24, color: "888888" })],
  }),
];

// ============================================================
// Assemble Document
// ============================================================
const doc = new Document({
  styles: {
    default: {
      document: {
        run: { font: FONT_BODY, size: 22, color: "333333" },
        paragraph: { spacing: { line: 360 } },
      },
    },
    paragraphStyles: [
      {
        id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 36, bold: true, font: FONT_HEADING, color: BLUE },
        paragraph: { spacing: { before: 400, after: 200 }, outlineLevel: 0 },
      },
      {
        id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 28, bold: true, font: FONT_HEADING, color: BLUE },
        paragraph: { spacing: { before: 300, after: 150 }, outlineLevel: 1 },
      },
      {
        id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 24, bold: true, font: FONT_HEADING, color: "333333" },
        paragraph: { spacing: { before: 200, after: 100 }, outlineLevel: 2 },
      },
    ],
  },
  numbering: {
    config: [
      {
        reference: "bullets",
        levels: [{
          level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } },
        }],
      },
    ],
  },
  sections: [
    { properties: { page: { size: { width: A4_WIDTH, height: A4_HEIGHT }, margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN } } }, children: cover },
    {
      properties: { page: { size: { width: A4_WIDTH, height: A4_HEIGHT }, margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN } } },
      headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "揽盛电气AI智能体平台 · 2026年中工作汇报", font: FONT_HEADING, size: 18, color: DARK_GRAY })] })] }) },
      footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [ new TextRun({ text: "第 ", font: FONT_BODY, size: 18, color: DARK_GRAY }), new TextRun({ children: [PageNumber.CURRENT], font: FONT_BODY, size: 18, color: DARK_GRAY }), new TextRun({ text: " 页", font: FONT_BODY, size: 18, color: DARK_GRAY }), ] })] }) },
      children: tocSection,
    },
    {
      properties: { page: { size: { width: A4_WIDTH, height: A4_HEIGHT }, margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN } } },
      headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "揽盛电气AI智能体平台 · 2026年中工作汇报", font: FONT_HEADING, size: 18, color: DARK_GRAY })] })] }) },
      footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [ new TextRun({ text: "第 ", font: FONT_BODY, size: 18, color: DARK_GRAY }), new TextRun({ children: [PageNumber.CURRENT], font: FONT_BODY, size: 18, color: DARK_GRAY }), new TextRun({ text: " 页", font: FONT_BODY, size: 18, color: DARK_GRAY }), ] })] }) },
      children: chapter1,
    },
    {
      properties: { page: { size: { width: A4_WIDTH, height: A4_HEIGHT }, margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN } } },
      headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "揽盛电气AI智能体平台 · 2026年中工作汇报", font: FONT_HEADING, size: 18, color: DARK_GRAY })] })] }) },
      footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [ new TextRun({ text: "第 ", font: FONT_BODY, size: 18, color: DARK_GRAY }), new TextRun({ children: [PageNumber.CURRENT], font: FONT_BODY, size: 18, color: DARK_GRAY }), new TextRun({ text: " 页", font: FONT_BODY, size: 18, color: DARK_GRAY }), ] })] }) },
      children: chapter2,
    },
    {
      properties: { page: { size: { width: A4_WIDTH, height: A4_HEIGHT }, margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN } } },
      headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "揽盛电气AI智能体平台 · 2026年中工作汇报", font: FONT_HEADING, size: 18, color: DARK_GRAY })] })] }) },
      footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [ new TextRun({ text: "第 ", font: FONT_BODY, size: 18, color: DARK_GRAY }), new TextRun({ children: [PageNumber.CURRENT], font: FONT_BODY, size: 18, color: DARK_GRAY }), new TextRun({ text: " 页", font: FONT_BODY, size: 18, color: DARK_GRAY }), ] })] }) },
      children: chapter3,
    },
    {
      properties: { page: { size: { width: A4_WIDTH, height: A4_HEIGHT }, margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN } } },
      headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "揽盛电气AI智能体平台 · 2026年中工作汇报", font: FONT_HEADING, size: 18, color: DARK_GRAY })] })] }) },
      footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [ new TextRun({ text: "第 ", font: FONT_BODY, size: 18, color: DARK_GRAY }), new TextRun({ children: [PageNumber.CURRENT], font: FONT_BODY, size: 18, color: DARK_GRAY }), new TextRun({ text: " 页", font: FONT_BODY, size: 18, color: DARK_GRAY }), ] })] }) },
      children: chapter4,
    },
    {
      properties: { page: { size: { width: A4_WIDTH, height: A4_HEIGHT }, margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN } } },
      headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "揽盛电气AI智能体平台 · 2026年中工作汇报", font: FONT_HEADING, size: 18, color: DARK_GRAY })] })] }) },
      footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [ new TextRun({ text: "第 ", font: FONT_BODY, size: 18, color: DARK_GRAY }), new TextRun({ children: [PageNumber.CURRENT], font: FONT_BODY, size: 18, color: DARK_GRAY }), new TextRun({ text: " 页", font: FONT_BODY, size: 18, color: DARK_GRAY }), ] })] }) },
      children: chapter5,
    },
  ],
});

// ============================================================
// Generate
// ============================================================
const outputPath = path.resolve(__dirname, '..', 'docs', '揽盛电气AI智能体平台-2026年中工作汇报_v2.docx');
const outputDir = path.dirname(outputPath);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync(outputPath, buffer);
  console.log(`✅ 汇报文档已生成: ${outputPath}`);
  console.log(`   文件大小: ${(buffer.length / 1024).toFixed(1)} KB`);
}).catch(err => {
  console.error('❌ 生成失败:', err);
  process.exit(1);
});
