  const exportToExcel = () => {
    if (!parseResult?.data || parseResult.data.length === 0) {
      alert('没有可导出的数据');
      return;
    }

    // 使用 xlsx 库导出 Excel
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

    // 添加表头
    const worksheet = XLSX.utils.aoa_to_sheet([
      ['外部编码', '收货门店', '收件人', '电话', '地址', 'SKU 编码', 'SKU 名称', '数量', '规格', '备注'],
      ...data
    ]);

    // 设置列宽
    worksheet['!cols'] = [
      { wch: 20 }, // 外部编码
      { wch: 25 }, // 收货门店
      { wch: 15 }, // 收件人
      { wch: 15 }, // 电话
      { wch: 30 }, // 地址
      { wch: 15 }, // SKU 编码
      { wch: 20 }, // SKU 名称
      { wch: 10 }, // 数量
      { wch: 15 }, // 规格
      { wch: 30 }  // 备注
    ];

    // 创建工作簿并下载
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '运单数据');
    XLSX.writeFile(workbook, `运单数据_${new Date().toLocaleString('zh-CN').replace(/[\/:]/g, '-')}.xlsx`);
  };
