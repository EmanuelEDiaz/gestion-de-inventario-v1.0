package com.inventory.adapters.web.controller.maps;

import org.springframework.core.env.Environment;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api/v1/maps")
public class MapController {

    private final Environment env;

    public MapController(Environment env) {
        this.env = env;
    }

    @GetMapping("/{filename:.+}")
    public Mono<ResponseEntity<Resource>> serveMap(
            @PathVariable String filename) {
        String mapsDir = env.getProperty("app.maps.location", "./maps/");
        Resource resource = new FileSystemResource(mapsDir + filename);
        if (!resource.exists()) return Mono.just(ResponseEntity.notFound().build());
        return Mono.just(ResponseEntity.ok()
            .header(HttpHeaders.ACCEPT_RANGES, "bytes")
            .header(HttpHeaders.CACHE_CONTROL, "public, max-age=31536000, immutable")
            .body(resource));
    }

    @GetMapping("/{filename:.+}.meta.json")
    public Mono<ResponseEntity<Resource>> serveMapMeta(@PathVariable String filename) {
        String mapsDir = env.getProperty("app.maps.location", "./maps/");
        Resource resource = new FileSystemResource(mapsDir + filename + ".meta.json");
        if (!resource.exists()) return Mono.just(ResponseEntity.notFound().build());
        return Mono.just(ResponseEntity.ok()
            .header(HttpHeaders.CACHE_CONTROL, "no-cache")
            .body(resource));
    }
}
