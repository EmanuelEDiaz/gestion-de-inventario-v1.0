package com.inventory.application.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.inventory.domain.errors.BadRequestException;
import com.inventory.domain.errors.DomainException;
import com.inventory.domain.ports.in.product.ProductCommandPort;
import com.inventory.domain.ports.in.sale.SaleCommandPort;
import com.inventory.domain.ports.in.purchase.PurchaseCommandPort;
import com.inventory.domain.ports.in.category.CategoryCommandPort;
import com.inventory.domain.ports.in.customer.CustomerCommandPort;
import com.inventory.domain.ports.in.supplier.SupplierCommandPort;
import com.inventory.domain.ports.in.transfer.TransferCommandPort;
import com.inventory.domain.ports.in.adjustment.AdjustmentCommandPort;
import com.inventory.domain.ports.in.returns.ReturnCommandPort;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
public class OperationRouter {

    private final Map<String, OperationHandler> handlers = new HashMap<>();
    private final ObjectMapper objectMapper;

    @FunctionalInterface
    public interface OperationHandler {
        Mono<Object> execute(Object payload, UUID userId);
    }

    public record PushResult(boolean success, Object data) {}

    public OperationRouter(
        ProductCommandPort productCommands,
        SaleCommandPort saleCommands,
        PurchaseCommandPort purchaseCommands,
        CategoryCommandPort categoryCommands,
        CustomerCommandPort customerCommands,
        SupplierCommandPort supplierCommands,
        TransferCommandPort transferCommands,
        AdjustmentCommandPort adjustmentCommands,
        ReturnCommandPort returnCommands,
        ObjectMapper objectMapper
    ) {
        this.objectMapper = objectMapper;

        handlers.put("PRODUCT/CREATE", (payload, userId) ->
            productCommands.create(userId, convert(payload, ProductCommandPort.CreateProductCommand.class)).cast(Object.class));
        handlers.put("PRODUCT/UPDATE", (payload, userId) -> {
            var cmd = convert(payload, Map.class);
            return productCommands.update(
                UUID.fromString((String) cmd.get("id")),
                userId,
                convert(cmd.get("data"), ProductCommandPort.UpdateProductCommand.class)
            ).cast(Object.class);
        });
        handlers.put("PRODUCT/DELETE", (payload, userId) -> {
            String id = payload instanceof Map m ? (String) m.get("id") : payload.toString();
            return productCommands.delete(UUID.fromString(id), userId).then(Mono.empty());
        });
        handlers.put("PRODUCT/ARCHIVE", (payload, userId) -> {
            String id = payload instanceof Map m ? (String) m.get("id") : payload.toString();
            return productCommands.archive(UUID.fromString(id), userId).cast(Object.class);
        });

        handlers.put("SALE/CREATE", (payload, userId) ->
            saleCommands.create(convert(payload, SaleCommandPort.CreateCommand.class), userId).cast(Object.class));

        handlers.put("PURCHASE/CREATE", (payload, userId) ->
            purchaseCommands.create(convert(payload, PurchaseCommandPort.CreatePurchaseCommand.class), userId).cast(Object.class));

        handlers.put("CATEGORY/CREATE", (payload, userId) ->
            categoryCommands.create(convert(payload, CategoryCommandPort.CreateCategoryCommand.class), userId).cast(Object.class));
        handlers.put("CATEGORY/UPDATE", (payload, userId) -> {
            var cmd = convert(payload, Map.class);
            return categoryCommands.update(
                UUID.fromString((String) cmd.get("id")),
                convert(cmd.get("data"), CategoryCommandPort.UpdateCategoryCommand.class),
                userId
            ).cast(Object.class);
        });
        handlers.put("CATEGORY/DELETE", (payload, userId) -> {
            String id = payload instanceof Map m ? (String) m.get("id") : payload.toString();
            return categoryCommands.delete(UUID.fromString(id), userId).then(Mono.empty());
        });

        handlers.put("CUSTOMER/CREATE", (payload, userId) ->
            customerCommands.create(convert(payload, CustomerCommandPort.CreateCommand.class), userId).cast(Object.class));
        handlers.put("CUSTOMER/UPDATE", (payload, userId) -> {
            var cmd = convert(payload, Map.class);
            return customerCommands.update(
                UUID.fromString((String) cmd.get("id")),
                convert(cmd.get("data"), CustomerCommandPort.UpdateCommand.class),
                userId
            ).cast(Object.class);
        });

        handlers.put("SUPPLIER/CREATE", (payload, userId) ->
            supplierCommands.create(convert(payload, SupplierCommandPort.CreateCommand.class), userId).cast(Object.class));
        handlers.put("SUPPLIER/UPDATE", (payload, userId) -> {
            var cmd = convert(payload, Map.class);
            return supplierCommands.update(
                UUID.fromString((String) cmd.get("id")),
                convert(cmd.get("data"), SupplierCommandPort.UpdateCommand.class),
                userId
            ).cast(Object.class);
        });

        handlers.put("TRANSFER/CREATE", (payload, userId) ->
            transferCommands.create(convert(payload, TransferCommandPort.CreateTransferCommand.class)).cast(Object.class));

        handlers.put("ADJUSTMENT/CREATE", (payload, userId) ->
            adjustmentCommands.create(convert(payload, AdjustmentCommandPort.CreateAdjustmentCommand.class)).cast(Object.class));

        handlers.put("RETURN/CREATE", (payload, userId) ->
            returnCommands.create(convert(payload, ReturnCommandPort.CreateReturnCommand.class)).cast(Object.class));
    }

    public Mono<PushResult> route(String entityType, String action, Object payload, UUID userId) {
        var key = entityType + "/" + action;
        var handler = handlers.get(key);
        if (handler == null) {
            return Mono.just(new PushResult(false, "Unknown operation: " + key));
        }
        return handler.execute(payload, userId)
            .map(result -> new PushResult(true, result))
            .onErrorResume(e -> {
                if (e instanceof BadRequestException || e instanceof DomainException) {
                    return Mono.error(e);
                }
                return Mono.just(new PushResult(false, e.getMessage()));
            });
    }

    @SuppressWarnings("unchecked")
    private <T> T convert(Object payload, Class<T> type) {
        try {
            return objectMapper.convertValue(payload, type);
        } catch (IllegalArgumentException e) {
            throw new BadRequestException(
                "Payload inválido para " + type.getSimpleName() + ": " + e.getMessage());
        }
    }
}
