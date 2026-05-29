package com.inventory.application.service;

import com.inventory.domain.errors.BadRequestException;
import org.springframework.stereotype.Component;

import java.util.regex.Pattern;

@Component
public class SettingsValidator {

    private static final Pattern CRON_PATTERN = Pattern.compile(
        "^(@(annually|yearly|monthly|weekly|daily|hourly|reboot))|" +
        "(@every\\s+(\\d+[smhd]?))|" +
        "(^(\\*|\\d+|[\\d,-]+|\\d+\\-\\d+(\\/\\d+)?)\\s+){4}" +
        "(\\*|\\d+|[\\d,-]+|\\d+\\-\\d+(\\/\\d+)?)$");

    public void validate(String key, String value, String valueType) {
        switch (valueType) {
            case "integer" -> {
                try {
                    Integer.parseInt(value);
                } catch (NumberFormatException e) {
                    throw new BadRequestException(
                        "Valor inválido para " + key + ": debe ser un número entero");
                }
            }
            case "boolean" -> {
                if (!"true".equals(value) && !"false".equals(value))
                    throw new BadRequestException(
                        "Valor inválido para " + key + ": debe ser 'true' o 'false'");
            }
            case "cron" -> {
                if (!CRON_PATTERN.matcher(value).matches())
                    throw new BadRequestException(
                        "Valor inválido para " + key + ": debe ser expresión cron válida");
            }
        }
    }
}
