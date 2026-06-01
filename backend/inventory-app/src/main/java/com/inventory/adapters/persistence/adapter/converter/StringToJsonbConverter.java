package com.inventory.adapters.persistence.adapter.converter;

import io.r2dbc.postgresql.codec.Json;
import org.springframework.core.convert.converter.Converter;
import org.springframework.data.convert.WritingConverter;
import org.springframework.stereotype.Component;

@Component
@WritingConverter
public class StringToJsonbConverter implements Converter<String, Json> {

    @Override
    public Json convert(String source) {
        if (source == null) return null;
        return Json.of(source);
    }
}
