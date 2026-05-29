package com.inventory.application.dto.export;

import java.math.BigDecimal;

public record ExportSalesRow(
    String date,
    String invoiceNumber,
    String customerName,
    BigDecimal total,
    BigDecimal cost,
    BigDecimal profit,
    String paymentMode,
    String warehouseName
) {
    public String toCsvLine() {
        return String.join(",",
            date, invoiceNumber, "\"" + customerName + "\"",
            total.toString(), cost.toString(), profit.toString(),
            paymentMode, warehouseName);
    }
}
