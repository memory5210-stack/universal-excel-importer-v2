'use client';

import { useState } from 'react';
import { Save, Wand2, Upload, AlertCircle } from 'lucide-react';

export default function NewRulePage() {
  const [ruleName, setRuleName] = useState('');
  const [fileType, setFileType] = useState<'excel' | 'word' | 'pdf'>('excel');
  const [description, setDescription] = useState('');
  const [analyzing, setAnalyzing] = useState(false);

  const handleAIAnalyze = async () => {
    setAnalyzing(true);
    // TODO: 调用 AI 分析接口生成规则
    setTimeout(() => {
      setAnalyzing(false);
      alert('AI 分析完成！规则已生成，请确认并保存。');
    }, 2000);
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="card">
        <h1 className="text-2xl font-bold mb-6">新建解析规则</h1>

        <div className="space-y-6">
          {/* 基本信息 */}
          <div>
            <label className="block font-medium mb-2">规则名称</label>
            <input
              type="text"
              className="w-full border border-border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="如：黎明屯配送发货单"
              value={ruleName}
              onChange={(e) => setRuleName(e.target.value)}
            />
          </div>

          <div>
            <label className="block font-medium mb-2">文件类型</label>
            <select
              className="w-full border border-border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              value={fileType}
              onChange={(e) => setFileType(e.target.value as any)}
            >
              <option value="excel">Excel (.xlsx/.xls)</option>
              <option value="word">Word (.docx)</option>
              <option value="pdf">PDF</option>
            </select>
          </div>

          <div>
            <label className="block font-medium mb-2">描述</label>
            <textarea
              className="w-full border border-border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              rows={3}
              placeholder="简要描述文件结构特征..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* AI 辅助生成 */}
          <div className="bg-primary-light rounded-lg p-4 border border-primary">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold flex items-center gap-2">
                <Wand2 className="w-5 h-5 text-primary" />
                AI 辅助生成规则
              </h3>
              <button
                className="btn-primary flex items-center gap-2"
                onClick={handleAIAnalyze}
                disabled={analyzing}
              >
                <Wand2 className="w-4 h-4" />
                {analyzing ? '分析中...' : '开始分析'}
              </button>
            </div>
            <p className="text-sm text-text-muted">
              上传样例文件后，AI 将自动分析文件结构并生成解析规则。您可以在此基础上手动微调后保存。
            </p>

            {/* 样例文件上传 */}
            <div className="mt-4 border-2 border-dashed border-primary-light rounded-lg p-6 text-center">
              <input
                type="file"
                id="sample-file"
                className="hidden"
                accept=".xlsx,.xls,.docx,.pdf"
              />
              <label htmlFor="sample-file" className="cursor-pointer">
                <Upload className="w-8 h-8 mx-auto mb-2 text-text-muted" />
                <p className="text-sm text-primary hover:underline">点击上传样例文件</p>
                <p className="text-xs text-text-muted mt-1">用于 AI 分析和规则测试</p>
              </label>
            </div>
          </div>

          {/* 规则配置区域 */}
          <div className="border border-border rounded-lg p-4">
            <h3 className="font-bold mb-4">规则详细配置</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">跳过的头部行数</label>
                <input
                  type="number"
                  className="w-full border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  placeholder="0"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">表头行索引</label>
                <input
                  type="number"
                  className="w-full border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  placeholder="从 0 开始"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">数据起始行</label>
                <input
                  type="number"
                  className="w-full border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  placeholder="从 0 开始"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">是否矩阵转置</label>
                <select className="w-full border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary text-sm">
                  <option value="false">否</option>
                  <option value="true">是</option>
                </select>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium mb-1">字段映射配置</label>
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-sm text-text-muted">外部编码 → <span className="font-mono"></span></span>
                  <input type="text" className="border border-border rounded px-2 py-1 text-sm" placeholder="列名或索引" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-sm text-text-muted">收货门店 → <span className="font-mono"></span></span>
                  <input type="text" className="border border-border rounded px-2 py-1 text-sm" placeholder="列名或索引" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-sm text-text-muted">SKU 编码 → <span className="font-mono"></span></span>
                  <input type="text" className="border border-border rounded px-2 py-1 text-sm" placeholder="列名或索引" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-sm text-text-muted">SKU 名称 → <span className="font-mono"></span></span>
                  <input type="text" className="border border-border rounded px-2 py-1 text-sm" placeholder="列名或索引" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-sm text-text-muted">数量 → <span className="font-mono"></span></span>
                  <input type="text" className="border border-border rounded px-2 py-1 text-sm" placeholder="列名或索引" />
                </div>
              </div>
            </div>

            <div className="mt-4">
              <div className="flex items-center gap-2 text-danger bg-danger/10 p-2 rounded">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">更多高级规则（跨行聚合、卡片识别、复合单元格拆分等）可通过 AI 分析自动生成</span>
              </div>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-3 pt-4 border-t border-border">
            <button className="btn-primary flex items-center gap-2" style={{background: 'var(--success)'}}>
              <Save className="w-4 h-4" />
              保存规则
            </button>
            <a href="/rules" className="px-4 py-2 border border-border rounded-lg text-text-secondary hover:bg-surface-hover">
              取消
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
