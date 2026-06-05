'use client';

import { useState } from 'react';
import { Search, ChevronLeft, ChevronRight, Filter } from 'lucide-react';

export default function ShipmentsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'externalCode' | 'receiverName'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // 模拟数据
  const mockShipments = Array.from({length: 50}, (_, i) => ({
    id: `shipment-${i}`,
    externalCode: `PS251222000${i + 1}`,
    storeName: i % 3 === 0 ? '尹三顺自助烤肉（银泰店）' : '-',
    receiverName: i % 3 === 0 ? '-' : '张三',
    receiverPhone: i % 3 === 0 ? '-' : '13800138000',
    receiverAddress: i % 3 === 0 ? '-' : '北京市朝阳区',
    skuCode: `SKU${10000 + i}`,
    skuName: `精品肥牛${i + 1}`,
    skuQuantity: Math.floor(Math.random() * 10) + 1,
    skuSpecification: '500g/盒',
    createdAt: new Date(2026, 5, 1, 10, i % 60).toISOString()
  }));

  const filteredShipments = mockShipments.filter(item => {
    if (filterType === 'externalCode') {
      return item.externalCode.toLowerCase().includes(searchTerm.toLowerCase());
    } else if (filterType === 'receiverName') {
      return item.receiverName?.includes(searchTerm);
    }
    return true;
  });

  const totalPages = Math.ceil(filteredShipments.length / pageSize);
  const paginatedShipments = filteredShipments.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="card">
        <h1 className="text-2xl font-bold mb-6">已导入运单</h1>

        {/* 筛选搜索 */}
        <div className="flex gap-3 mb-6">
          <select
            className="border border-border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
          >
            <option value="all">全部字段</option>
            <option value="externalCode">外部编码</option>
            <option value="receiverName">收件人姓名</option>
          </select>
          <div className="flex-1 relative">
            <input
              type="text"
              className="w-full pl-4 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="搜索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="btn-primary flex items-center gap-2">
            <Filter className="w-4 h-4" />
            筛选
          </button>
        </div>

        {/* 运单列表 */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="bg-primary-light text-primary-dark p-3 text-left border border-border font-semibold w-20">ID</th>
                <th className="bg-primary-light text-primary-dark p-3 text-left border border-border font-semibold">外部编码</th>
                <th className="bg-primary-light text-primary-dark p-3 text-left border border-border font-semibold">收货门店</th>
                <th className="bg-primary-light text-primary-dark p-3 text-left border border-border font-semibold">收件人</th>
                <th className="bg-primary-light text-primary-dark p-3 text-left border border-border font-semibold">电话</th>
                <th className="bg-primary-light text-primary-dark p-3 text-left border border-border font-semibold">地址</th>
                <th className="bg-primary-light text-primary-dark p-3 text-left border border-border font-semibold">SKU 编码</th>
                <th className="bg-primary-light text-primary-dark p-3 text-left border border-border font-semibold">SKU 名称</th>
                <th className="bg-primary-light text-primary-dark p-3 text-left border border-border font-semibold text-center">数量</th>
                <th className="bg-primary-light text-primary-dark p-3 text-left border border-border font-semibold">提交时间</th>
              </tr>
            </thead>
            <tbody>
              {paginatedShipments.map((shipment) => (
                <tr key={shipment.id} className="hover:bg-surface-hover">
                  <td className="p-3 border border-border text-text-muted">#{shipment.id.split('-')[1]}</td>
                  <td className="p-3 border border-border font-mono text-sm">{shipment.externalCode}</td>
                  <td className="p-3 border border-border">{shipment.storeName}</td>
                  <td className="p-3 border border-border">{shipment.receiverName}</td>
                  <td className="p-3 border border-border font-mono text-sm">{shipment.receiverPhone}</td>
                  <td className="p-3 border border-border text-sm max-w-xs truncate">{shipment.receiverAddress}</td>
                  <td className="p-3 border border-border font-mono text-sm">{shipment.skuCode}</td>
                  <td className="p-3 border border-border">{shipment.skuName}</td>
                  <td className="p-3 border border-border text-center">{shipment.skuQuantity}</td>
                  <td className="p-3 border border-border text-sm text-text-muted">
                    {new Date(shipment.createdAt).toLocaleString('zh-CN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 分页 */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
          <div className="text-sm text-text-muted">
            共 {filteredShipments.length} 条，第 {currentPage} / {totalPages} 页
          </div>
          <div className="flex gap-2">
            <button
              className="px-3 py-1 border border-border rounded-lg hover:bg-surface-hover disabled:opacity-50"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              className="px-3 py-1 border border-border rounded-lg hover:bg-surface-hover disabled:opacity-50"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
