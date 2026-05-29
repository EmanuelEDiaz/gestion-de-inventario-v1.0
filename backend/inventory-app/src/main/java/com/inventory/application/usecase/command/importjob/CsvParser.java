package com.inventory.application.usecase.command.importjob;

import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.springframework.stereotype.Component;

import java.io.StringReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
public class CsvParser {

    public CsvParseResult parse(String csvContent, Map<String, String> mapping) {
        List<String> errors = new ArrayList<>();
        List<Map<String, String>> rows = new ArrayList<>();
        List<String> headers = new ArrayList<>();

        try {
            CSVParser parser = CSVFormat.DEFAULT
                .withFirstRecordAsHeader()
                .withTrim()
                .parse(new StringReader(csvContent));

            headers.addAll(parser.getHeaderNames());

            int rowNum = 1;
            for (CSVRecord record : parser) {
                rowNum++;
                Map<String, String> mappedRow = new HashMap<>();
                boolean valid = true;

                for (Map.Entry<String, String> entry : mapping.entrySet()) {
                    String csvColumn = entry.getKey();
                    String entityField = entry.getValue();

                    if (!parser.getHeaderNames().contains(csvColumn)) {
                        errors.add("Fila " + rowNum + ": columna '" + csvColumn + "' no encontrada en el CSV");
                        valid = false;
                        continue;
                    }

                    String value = record.get(csvColumn);
                    mappedRow.put(entityField, value != null ? value.trim() : "");
                }

                if (valid) {
                    rows.add(mappedRow);
                }
            }
        } catch (Exception e) {
            errors.add("Error al parsear CSV: " + e.getMessage());
        }

        return new CsvParseResult(rows, errors, headers);
    }

    public record CsvParseResult(
        List<Map<String, String>> rows,
        List<String> errors,
        List<String> headers
    ) {}
}
