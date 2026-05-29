package com.inventory.application.dto.export;

import java.math.BigDecimal;

public record ExportInventoryRow(
    String code,
    String product,
    String category,
    String warehouse,
    BigDecimal stock,
    BigDecimal unitCost,
    BigDecimal totalValue
) {
    public String toCsvLine() {
        return String.join(",",
            code, "\"" + product + "\"", "\"" + category + "\"",
            "\"" + warehouse + "\"", stock.toString(), unitCost.toString(), totalValue.toString());
    }
}
