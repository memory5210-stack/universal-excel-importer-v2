'use client';

import { useState, useCallback, useMemo } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Trash2, Plus, Download, Save, Wand2, Loader2 } from 'lucide-react';
import { useToast } from '@/components/Toast';
import { validateShipmentData, getFieldErrors } from '@/lib/validator';
import type { ValidationError } from '@/lib/validator';

export default function Home() {
  const toast = useToast();
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [parseResult, setParseResult] = useState<any>(null);
  const [selectedRule, setSelectedRule] = useState('');
  const [progress, setProgress] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

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
    setProgress(0);
    toast.info(`开始解析文件：${file.name}`);
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('ruleId', selectedRule);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      
      if (!result.success) {
        toast.error(`解析失败：${result.error}`);
        setUploading(false);
        return;
      }

      // 模拟进度条
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 10;
        });
      }, 100);

      setTimeout(() => {
        setParseResult(result.data);
        setUploading(false);
        setProgress(100);
        toast.success(`解析成功：${result.data.parsedData?.length || 0} 条数据`);
      }, 1000);
    } catch (error) {
      console.error('Parse error:', error);
      toast.error('解析失败，请重试');
      setUploading(false);
    }
  };

  const handleAIAnalyze = () => {
    toast.info('AI 分析功能开发中...');
  };

  const handleValidate = () => {
    if (!parseResult?.data) {
      toast.warning('没有可验证的数据');
      return;
    }

    const errors = validateShipmentData(parseResult.data);
    setValidationErrors(errors);

    if (errors.length === 0) {
      toast.success('数据校验通过！');
    } else {
      toast.error(`发现 ${errors.length} 个错误，请修正后提交`);
    }
  };

  const handleExportExcel = () => {
    if (!parseResult?.data || parseResult.data.length === 0) {
      toast.warning('没有可导出的数据');
      return;
    }

    import('xlsx').then((XLSX) => {
      const data = parseResult.data.map((row: any) => [
        row.externalCode || '',
        row.storeName || '',
        row.receiverName || '',
        row.receiverPhone || '',
        row.receiverAddress || '',
        row.skuCode,
        row.skuName,
        row.skuQuantity,
        row.skuSpecification || '',
        row.remarks || ''
      ]);

      const worksheet = XLSX.utils.aoa_to_sheet([
        ['外部编码', '收货门店', '收件人', '电话', '地址', 'SKU 编码', 'SKU 名称', '数量', '规格', '备注'],
        ...data
      ]);

      worksheet['!cols'] = [
        { wch: 20 }, { wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 30 },
        { wch: 15 }, { wch: 20 }, { wch: 10 }, { wch: 15 }, { wch: 30 }
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, '运单数据');
      XLSX.writeFile(workbook, `运单数据_${new Date().toLocaleString('zh-CN').replace(/[\/:]/g, '-')}.xlsx`);
      
      toast.success('Excel 导出成功！');
    });
  };

  const handleSubmit = async () => {
    if (!parseResult?.data) {
      toast.warning('没有可提交的数据');
      return;
    }

    // 先校验数据
    const errors = validateShipmentData(parseResult.data);
    if (errors.length > 0) {
      setValidationErrors(errors);
      toast.error(`存在 ${errors.length} 个错误，请修正后提交`);
      return;
    }

    setSubmitting(true);
    setUploading(true);
    setProgress(0);

    try {
      const response = await fetch('/api/shipments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shipments: parseResult.data,
          ruleId: selectedRule
        }),
      });

      const result = await response.json();
      
      if (!result.success) {
        toast.error(`提交失败：${result.error}`);
        return;
      }

      setProgress(100);
      toast.success(`提交成功！共 ${result.data.count} 条运单`);
      setParseResult(null);
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('提交失败，请重试');
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  };

  const handleCellEdit = (rowIndex: number, field: string, value: string | number) => {
    if (!parseResult?.data) return;

    const newData = [...parseResult.data];
    newData[rowIndex] = { ...newData[rowIndex], [field]: value };
    setParseResult({ ...parseResult, data: newData });

    // 重新校验
    const errors = validateShipmentData(newData);
    setValidationErrors(errors);
  };

  const handleAddRow = () => {
    if (!parseResult) return;
    const newRow = { skuCode: '', skuName: '', skuQuantity: 0 };
    setParseResult({
      ...parseResult,
      data: [...(parseResult.data || []), newRow],
      totalRows: parseResult.totalRows + 1
    });
    toast.info('已添加空行');
  };

  const handleDeleteRow = (index: number) => {
    if (!parseResult?.data) return;
    const newData = parseResult.data.filter((_: any, i: number) => i !== index);
    setParseResult({
      ...parseResult,
      data: newData,
      totalRows: parseResult.totalRows - 1
    });
    toast.success('已删除该行');
  };

  const hasError = useCallback((row: number, field: string) => {
    return validationErrors.some(e => e.row === row && e.field === field as any);
  }, [validationErrors]);

  const getErrorMessage = useCallback((row: number, field: string) => {
    const errors = getFieldErrors(validationErrors, row, field as any);
    return errors[0]?.message || '';
  }, [validationErrors]);

  // 使用 useMemo 优化大数据渲染
  const tableRows = useMemo(() => {
    if (!parseResult?.data) return [];
    return parseResult.data.slice(0, 100); // 限制渲染
  }, [parseResult?.data]);

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
              <a href="/rules/new" className="text-primary hover:underline text-sm">新建规则</a>
              <a href="/rules" className="text-primary hover:underline text-sm">管理规则</a>
            </div>
          </div>
        )}

        {/* 上传进度条 */}
        {uploading && (
          <div className="mt-6">
            <div className="h-2 bg-primary-light rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-sm text-text-muted mt-2 text-center">
              {progress < 100 ? '正在解析文件...' : '解析完成！'}
            </p>
          </div>
        )}
      </div>

      {/* 数据预览区域 */}
      {parseResult && (
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              数据预览{validationErrors.length > 0 && `（发现${validationErrors.length}个错误）`}
            </h2>
            <div className="flex gap-3">
              <button 
                className="btn-primary flex items-center gap-2"
                onClick={handleValidate}
              >
                <CheckCircle className="w-4 h-4" />
                数据校验
              </button>
              <button 
                className="btn-primary flex items-center gap-2"
                onClick={handleExportExcel}
              >
                <Download className="w-4 h-4" />
                导出 Excel
              </button>
              <button 
                className="btn-primary flex items-center gap-2"
                onClick={handleSubmit}
                disabled={submitting || uploading}
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                提交下单
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="bg-primary-light text-primary-dark p-3 text-left border border-border font-semibold sticky top-0">操作</th>
                  <th className="bg-primary-light text-primary-dark p-3 text-left border border-border font-semibold sticky top-0">外部编码</th>
                  <th className="bg-primary-light text-primary-dark p-3 text-left border border-border font-semibold sticky top-0">收货门店</th>
                  <th className="bg-primary-light text-primary-dark p-3 text-left border border-border font-semibold sticky top-0">收件人</th>
                  <th className="bg-primary-light text-primary-dark p-3 text-left border border-border font-semibold sticky top-0">电话</th>
                  <th className="bg-primary-light text-primary-dark p-3 text-left border border-border font-semibold sticky top-0">地址</th>
                  <th className="bg-primary-light text-primary-dark p-3 text-left border border-border font-semibold sticky top-0">SKU 编码</th>
                  <th className="bg-primary-light text-primary-dark p-3 text-left border border-border font-semibold sticky top-0">SKU 名称</th>
                  <th className="bg-primary-light text-primary-dark p-3 text-center border border-border font-semibold sticky top-0">数量</th>
                  <th className="bg-primary-light text-primary-dark p-3 text-left border border-border font-semibold sticky top-0">规格</th>
                  <th className="bg-primary-light text-primary-dark p-3 text-left border border-border font-semibold sticky top-0">备注</th>
                </tr>
              </thead>
              <tbody>
                {tableRows.map((row: any, index: number) => (
                  <tr key={index} className={`hover:bg-surface-hover ${validationErrors.filter(e => e.row === index).length > 0 ? 'bg-red-50' : ''}`}>
                    <td className="p-2 border border-border sticky left-0 bg-white">
                      <button 
                        onClick={() => handleDeleteRow(index)}
                        className="text-danger hover:underline flex items-center gap-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                    <td className={`p-2 border border-border ${hasError(index, 'externalCode') ? 'error-cell' : ''}`}>
                      <input
                        type="text"
                        value={row.externalCode || ''}
                        onChange={(e) => handleCellEdit(index, 'externalCode', e.target.value)}
                        className="w-full border-none focus:outline-none focus:ring-1 focus:ring-primary px-2 py-1"
                      />
                      {hasError(index, 'externalCode') && (
                        <div className="text-xs text-danger mt-1">{getErrorMessage(index, 'externalCode')}</div>
                      )}
                    </td>
                    <td className={`p-2 border border-border ${hasError(index, 'storeName') ? 'error-cell' : ''}`}>
                      <input
                        type="text"
                        value={row.storeName || ''}
                        onChange={(e) => handleCellEdit(index, 'storeName', e.target.value)}
                        className="w-full border-none focus:outline-none focus:ring-1 focus:ring-primary px-2 py-1"
                      />
                    </td>
                    <td className={`p-2 border border-border ${hasError(index, 'receiverName') ? 'error-cell' : ''}`}>
                      <input
                        type="text"
                        value={row.receiverName || ''}
                        onChange={(e) => handleCellEdit(index, 'receiverName', e.target.value)}
                        className="w-full border-none focus:outline-none focus:ring-1 focus:ring-primary px-2 py-1"
                      />
                    </td>
                    <td className={`p-2 border border-border ${hasError(index, 'receiverPhone') ? 'error-cell' : ''}`}>
                      <input
                        type="text"
                        value={row.receiverPhone || ''}
                        onChange={(e) => handleCellEdit(index, 'receiverPhone', e.target.value)}
                        className="w-full border-none focus:outline-none focus:ring-1 focus:ring-primary px-2 py-1"
                      />
                    </td>
                    <td className={`p-2 border border-border ${hasError(index, 'receiverAddress') ? 'error-cell' : ''}`}>
                      <input
                        type="text"
                        value={row.receiverAddress || ''}
                        onChange={(e) => handleCellEdit(index, 'receiverAddress', e.target.value)}
                        className="w-full border-none focus:outline-none focus:ring-1 focus:ring-primary px-2 py-1"
                      />
                    </td>
                    <td className={`p-2 border border-border ${hasError(index, 'skuCode') ? 'error-cell' : ''}`}>
                      <input
                        type="text"
                        value={row.skuCode || ''}
                        onChange={(e) => handleCellEdit(index, 'skuCode', e.target.value)}
                        className="w-full border-none focus:outline-none focus:ring-1 focus:ring-primary px-2 py-1"
                      />
                    </td>
                    <td className={`p-2 border border-border ${hasError(index, 'skuName') ? 'error-cell' : ''}`}>
                      <input
                        type="text"
                        value={row.skuName || ''}
                        onChange={(e) => handleCellEdit(index, 'skuName', e.target.value)}
                        className="w-full border-none focus:outline-none focus:ring-1 focus:ring-primary px-2 py-1"
                      />
                    </td>
                    <td className={`p-2 border border-border text-center ${hasError(index, 'skuQuantity') ? 'error-cell' : ''}`}>
                      <input
                        type="number"
                        value={row.skuQuantity || ''}
                        onChange={(e) => handleCellEdit(index, 'skuQuantity', parseInt(e.target.value) || 0)}
                        className="w-20 border-none focus:outline-none focus:ring-1 focus:ring-primary px-2 py-1 text-center"
                      />
                    </td>
                    <td className={`p-2 border border-border ${hasError(index, 'skuSpecification') ? 'error-cell' : ''}`}>
                      <input
                        type="text"
                        value={row.skuSpecification || ''}
                        onChange={(e) => handleCellEdit(index, 'skuSpecification', e.target.value)}
                        className="w-full border-none focus:outline-none focus:ring-1 focus:ring-primary px-2 py-1"
                      />
                    </td>
                    <td className={`p-2 border border-border ${hasError(index, 'remarks') ? 'error-cell' : ''}`}>
                      <input
                        type="text"
                        value={row.remarks || ''}
                        onChange={(e) => handleCellEdit(index, 'remarks', e.target.value)}
                        className="w-full border-none focus:outline-none focus:ring-1 focus:ring-primary px-2 py-1"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex justify-between items-center">
            <div className="text-sm text-text-muted">
              共 {parseResult.totalRows} 条，当前显示前 100 条（{parseResult.validRows || parseResult.totalRows} 条有效）
              {validationErrors.length > 0 && (
                <span className="text-danger ml-2">
                  {validationErrors.length} 个错误待修正
                </span>
              )}
            </div>
            <button 
              onClick={handleAddRow}
              className="flex items-center gap-2 text-primary hover:underline"
            >
              <Plus className="w-4 h-4" />
              新增空行
            </button>
          </div>
        </div>
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
