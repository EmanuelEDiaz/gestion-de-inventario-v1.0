package com.inventory.application.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Set;
import java.util.UUID;

@Service
public class ImageProcessingService {

    @Value("${inventory.media.root:./media}")
    private String mediaRoot;

    private static final int MAX_WIDTH = 4096;
    private static final int MAX_HEIGHT = 4096;

    public String processAndSave(UUID productId, byte[] fileData, 
                                 String originalFilename, String contentType) throws IOException {
        BufferedImage image = ImageIO.read(new ByteArrayInputStream(fileData));
        if (image == null) {
            throw new IllegalArgumentException("No se puede decodificar la imagen");
        }
        if (image.getWidth() > MAX_WIDTH || image.getHeight() > MAX_HEIGHT) {
            throw new IllegalArgumentException("Dimensiones máximas: 4096x4096");
        }

        String ext = getExtension(contentType);
        UUID imageId = UUID.randomUUID();
        String relativePath = String.format("products/%s/original/%s.%s", productId, imageId, ext);
        Path targetPath = Paths.get(mediaRoot, relativePath);

        Files.createDirectories(targetPath.getParent());
        Files.write(targetPath, fileData);

        generateThumbnail(image, productId, imageId, 256);
        generateThumbnail(image, productId, imageId, 1024);

        return "/" + relativePath;
    }

    private void generateThumbnail(BufferedImage original, UUID productId, 
                                    UUID imageId, int size) throws IOException {
        int width = original.getWidth();
        int height = original.getHeight();
        
        double scale = Math.min((double) size / width, (double) size / height);
        int newWidth = (int) (width * scale);
        int newHeight = (int) (height * scale);

        BufferedImage thumbnail = new BufferedImage(newWidth, newHeight, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = thumbnail.createGraphics();
        g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
        g.drawImage(original, 0, 0, newWidth, newHeight, null);
        g.dispose();

        String thumbPath = String.format("products/%s/thumb/%d/%s.jpg", productId, size, imageId);
        Path targetPath = Paths.get(mediaRoot, thumbPath);
        Files.createDirectories(targetPath.getParent());
        ImageIO.write(thumbnail, "jpg", targetPath.toFile());
    }

    private String getExtension(String contentType) {
        return switch (contentType) {
            case "image/jpeg" -> "jpg";
            case "image/png" -> "png";
            case "image/webp" -> "webp";
            default -> "jpg";
        };
    }
}