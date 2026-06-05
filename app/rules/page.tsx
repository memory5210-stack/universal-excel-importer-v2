'use client';

import { useState } from 'react';
import { FileText, Plus, Edit, Trash2, Copy, Search, Wand2, Save } from 'lucide-react';

export default function RulesPage() {
  const [rules, setRules] = useState([
    {
      id: 'rule1',
      name: '黎明屯配送发货单',
      fileType: 'excel',
      description: '42 列，3 行干扰头部，第 4 行表头，底部横向排列收货人信息',
      createdAt: '2026-06-01'
    },
    {
      id: 'rule2',
      name: '湖南仓发货明细',
      fileType: 'excel',
      description: '按配送单号分组，跨行聚合',
      createdAt: '2026-06-01'
    },
    {
      id: 'rule3',
      name: '欢乐牧场模板',
      fileType: 'excel',
      description: 'SKU×门店矩阵，需要转置',
      createdAt: '2026-06-01'
    },
    {
      id: 'rule4',
      name: '黔寨寨配送单',
      fileType: 'pdf',
      description: 'PDF 格式，头部元信息，底部收货人',
      createdAt: '2026-06-01'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');

  const filteredRules = rules.filter(rule =>
    rule.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rule.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary" />
            解析规则管理
          </h1>
          <div className="flex gap-3">
            <a
              href="/rules/new"
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              新建规则
            </a>
            <button className="btn-primary flex items-center gap-2" style={{background: 'var(--success)'}}>
              <Save className="w-4 h-4" />
              保存
            </button>
          </div>
        </div>

        {/* 搜索框 */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
            <input
              type="text"
              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="搜索规则名称或描述..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* 规则列表 */}
        <div className="space-y-4">
          {filteredRules.map((rule) => (
            <div
              key={rule.id}
              className="border border-border rounded-lg p-4 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-bold text-lg">{rule.name}</h3>
                    <span className="tag">
                      {rule.fileType === 'excel' && 'Excel'}
                      {rule.fileType === 'word' && 'Word'}
                      {rule.fileType === 'pdf' && 'PDF'}
                    </span>
                  </div>
                  <p className="text-sm text-text-muted mb-2">{rule.description}</p>
                  <p className="text-xs text-text-muted">创建于：{rule.createdAt}</p>
                </div>
                <div className="flex gap-2">
                  <a
                    href={`/rules/${rule.id}`}
                    className="p-2 hover:bg-primary-light rounded-lg text-text-secondary"
                    title="编辑"
                  >
                    <Edit className="w-4 h-4" />
                  </a>
                  <button
                    className="p-2 hover:bg-primary-light rounded-lg text-text-secondary"
                    title="复制"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    className="p-2 hover:bg-danger/10 rounded-lg text-danger"
                    title="删除"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {filteredRules.length === 0 && (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 mx-auto mb-4 text-text-muted" />
              <p className="text-text-muted">暂无规则</p>
              <a href="/rules/new" className="btn-primary inline-flex mt-4">
                <Plus className="w-4 h-4 mr-2" />
                创建第一条规则
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
