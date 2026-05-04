package com.inventory.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.config.ResourceHandlerRegistry;
import org.springframework.web.reactive.config.WebFluxConfigurer;

import java.nio.file.Paths;

/**
 * Expone la carpeta de media (imágenes) como recurso HTTP estático en /media/**.
 * No requiere autenticación para leer imágenes (manejado en SecurityConfig).
 */
@Configuration
public class MediaWebConfig implements WebFluxConfigurer {

    @Value("${inventory.media.root:./media}")
    private String mediaRoot;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String absolutePath = Paths.get(mediaRoot).toAbsolutePath().normalize().toString();
        registry
            .addResourceHandler("/media/**")
            .addResourceLocations("file:" + absolutePath + "/");
    }
}
