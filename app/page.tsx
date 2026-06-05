'use client';

import { useState, useCallback } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Trash2, Plus, Download, Save, Wand2 } from 'lucide-react';

export default function Home() {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [parseResult, setParseResult] = useState<any>(null);
  const [selectedRule, setSelectedRule] = useState('');
  const [rules, setRules] = useState<any[]>([]);

  // 处理文件拖放
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  };

  const handleFile = async (file: File) => {
    setUploading(true);
    
    // TODO: 实际的上传和解析逻辑
    const formData = new FormData();
    formData.append('file', file);
    formData.append('ruleId', selectedRule);

    try {
      // 模拟解析结果
      setTimeout(() => {
        setParseResult({
          data: [
            {
              externalCode: 'PS2512220005001',
              storeName: '尹三顺自助烤肉（银泰店）',
              skuCode: '10001',
              skuName: '精品肥牛',
              skuQuantity: 5,
              skuSpecification: '500g/盒'
            }
          ],
          totalRows: 1,
          validRows: 1
        });
        setUploading(false);
      }, 1000);
    } catch (error) {
      console.error('Parse error:', error);
      setUploading(false);
    }
  };

  const handleAIAnalyze = async () => {
    // TODO: AI 分析文件并生成规则
    alert('AI 分析功能实现中...');
  };

  const exportToExcel = () => {
    // TODO: 导出 Excel
    alert('导出 Excel 功能实现中...');
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* 文件上传区域 */}
      <div className="card mb-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Upload className="w-5 h-5 text-primary" />
          文件导入
        </h2>
        
        <div
          className={`border-2 border-dashed rounded-12 p-12 text-center transition ${
            dragActive 
              ? 'border-primary bg-primary-light' 
              : 'border-border hover:border-primary/50'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            id="file-upload"
            className="hidden"
            accept=".xlsx,.xls,.docx,.pdf"
            onChange={handleFileSelect}
          />
          <label htmlFor="file-upload" className="cursor-pointer">
            <Upload className="w-12 h-12 mx-auto mb-4 text-text-muted" />
            <p className="text-lg font-medium mb-2">拖拽文件到此处，或点击上传</p>
            <p className="text-sm text-text-muted">
              支持 Excel (.xlsx/.xls)、Word (.docx)、PDF 格式
            </p>
          </label>
        </div>

        {/* 解析规则选择 */}
        {parseResult === null && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <label className="font-medium">选择解析规则</label>
              <button 
                className="btn-primary flex items-center gap-2"
                onClick={handleAIAnalyze}
              >
                <Wand2 className="w-4 h-4" />
                AI 生成规则
              </button>
            </div>
            <select
              className="w-full border border-border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              value={selectedRule}
              onChange={(e) => setSelectedRule(e.target.value)}
            >
              <option value="">-- 请选择规则 --</option>
              <option value="rule1">黎明屯配送发货单</option>
              <option value="rule2">湖南仓发货明细</option>
              <option value="rule3">欢乐牧场模板</option>
              <option value="rule4">黔寨寨配送单</option>
            </select>
            <div className="mt-3 flex gap-3">
              <a 
                href="/rules/new"
                className="text-primary hover:underline text-sm"
              >
                新建规则
              </a>
              <a 
                href="/rules"
                className="text-primary hover:underline text-sm"
              >
                管理规则
              </a>
            </div>
          </div>
        )}

        {/* 上传进度条 */}
        {uploading && (
          <div className="mt-6">
            <div className="h-2 bg-primary-light rounded-full overflow-hidden">
              <div className="h-full bg-primary animate-pulse w-1/3"></div>
            </div>
            <p className="text-sm text-text-muted mt-2 text-center">正在解析文件...</p>
          </div>
        )}
      </div>

      {/* 数据预览区域 */}
      {parseResult && (
        <>
          <div className="card mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                数据预览
              </h2>
              <div className="flex gap-3">
                <button 
                  className="btn-primary flex items-center gap-2"
                  onClick={exportToExcel}
                >
                  <Download className="w-4 h-4" />
                  导出 Excel
                </button>
                <button 
                  className="btn-primary flex items-center gap-2"
                  style={{background: 'var(--success)'}}
                >
                  <CheckCircle className="w-4 h-4" />
                  提交下单
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    {['外部编码', '收货门店', '收件人', '电话', '地址', 'SKU 编码', 'SKU 名称', '数量', '规格', '备注'].map((header) => (
                      <th key={header} className="bg-primary-light text-primary-dark p-3 text-left border border-border font-semibold">
                        {header}
                      </th>
                    ))}
                    <th className="bg-primary-light text-primary-dark p-3 text-left border border-border font-semibold">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {parseResult.data.map((row: any, index: number) => (
                    <tr key={index} className="hover:bg-surface-hover">
                      <td className="p-3 border border-border">{row.externalCode || '-'}</td>
                      <td className="p-3 border border-border">{row.storeName || '-'}</td>
                      <td className="p-3 border border-border">{row.receiverName || '-'}</td>
                      <td className="p-3 border border-border">{row.receiverPhone || '-'}</td>
                      <td className="p-3 border border-border">{row.receiverAddress || '-'}</td>
                      <td className="p-3 border border-border">{row.skuCode}</td>
                      <td className="p-3 border border-border">{row.skuName}</td>
                      <td className="p-3 border border-border">{row.skuQuantity}</td>
                      <td className="p-3 border border-border">{row.skuSpecification || '-'}</td>
                      <td className="p-3 border border-border">{row.remarks || '-'}</td>
                      <td className="p-3 border border-border">
                        <button className="text-danger hover:underline flex items-center gap-1">
                          <Trash2 className="w-4 h-4" />
                          删除
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex justify-between items-center">
              <div className="text-sm text-text-muted">
                共 {parseResult.totalRows} 条，有效 {parseResult.validRows} 条
              </div>
              <button className="flex items-center gap-2 text-primary hover:underline">
                <Plus className="w-4 h-4" />
                新增空行
              </button>
            </div>
          </div>
        </>
      )}

      {/* 演示文件说明 */}
      <div className="card">
        <h2 className="text-xl font-bold mb-4">支持的文件格式</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 bg-primary-light rounded-lg">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <span className="tag">Excel</span>
              标准表格
            </h3>
            <p className="text-sm text-text-muted">干扰头部、跨行聚合、矩阵转置、多 Sheet</p>
          </div>
          <div className="p-4 bg-primary-light rounded-lg">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <span className="tag tag-warning">Word</span>
              纯文本
            </h3>
            <p className="text-sm text-text-muted">段落格式、分隔线划分记录边界</p>
          </div>
          <div className="p-4 bg-primary-light rounded-lg">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <span className="tag">PDF</span>
              多页文档
            </h3>
            <p className="text-sm text-text-muted">多订单拆分、头部元信息、底部签字区</p>
          </div>
        </div>
      </div>
    </div>
  );
}
