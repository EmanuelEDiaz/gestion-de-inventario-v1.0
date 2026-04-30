package com.inventory.adapters.web.controller;

import com.inventory.application.dto.CustomerDebtDto;
import com.inventory.application.dto.DebtPaymentDto;
import com.inventory.application.mapper.SupplementaryApplicationMapper;
import com.inventory.domain.model.CustomerDebt;
import com.inventory.domain.model.DebtPayment;
import com.inventory.domain.ports.in.CustomerDebtCommandPort;
import com.inventory.domain.ports.in.CustomerDebtQueryPort;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.reactive.WebFluxTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.web.reactive.server.WebTestClient;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@WebFluxTest(CustomerDebtController.class)
@ContextConfiguration(classes = {CustomerDebtController.class, TestSecurityConfig.class})
@DisplayName("CustomerDebtController REST")
class CustomerDebtControllerTest {

    @Autowired
    private WebTestClient webTestClient;

    @MockBean
    private CustomerDebtCommandPort commandPort;

    @MockBean
    private CustomerDebtQueryPort queryPort;

    @MockBean
    private SupplementaryApplicationMapper mapper;

    private final UUID debtId     = UUID.randomUUID();
    private final UUID customerId = UUID.randomUUID();

    private CustomerDebt buildDebt() {
        return new CustomerDebt(
            debtId, customerId, UUID.randomUUID(),
            new BigDecimal("100.00"), BigDecimal.ZERO,
            "USD", CustomerDebt.DebtStatus.PENDING,
            "Deuda de prueba", Instant.now().plusSeconds(86400), null,
            Instant.now(), Instant.now(), 0L
        );
    }

    private CustomerDebtDto sampleDto() {
        return new CustomerDebtDto(
            debtId, customerId, UUID.randomUUID(),
            new BigDecimal("100.00"), BigDecimal.ZERO, new BigDecimal("100.00"),
            "USD", "PENDING", "Deuda de prueba",
            Instant.now().plusSeconds(86400), null,
            Instant.now(), Instant.now()
        );
    }

    @Test
    @DisplayName("GET /api/v1/debts devuelve 401 sin autenticación")
    void listAll_returns401WhenUnauthenticated() {
        webTestClient.get()
            .uri("/api/v1/debts")
            .exchange()
            .expectStatus().isUnauthorized();
    }

    @Test
    @WithMockUser(roles = "SELLER")
    @DisplayName("GET /api/v1/debts devuelve 403 con rol SELLER")
    void listAll_returns403WhenSeller() {
        webTestClient.get()
            .uri("/api/v1/debts")
            .exchange()
            .expectStatus().isForbidden();
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("GET /api/v1/debts devuelve lista de deudas con rol ADMIN")
    void listAll_returns200WhenAdmin() {
        CustomerDebt debt = buildDebt();
        CustomerDebtDto dto = sampleDto();
        when(queryPort.listOverdue()).thenReturn(Flux.just(debt));
        when(mapper.toDto(any(CustomerDebt.class))).thenReturn(dto);

        webTestClient.get()
            .uri("/api/v1/debts")
            .exchange()
            .expectStatus().isOk()
            .expectBodyList(CustomerDebtDto.class)
            .hasSize(1);
    }

    @Test
    @WithMockUser(roles = "MANAGER")
    @DisplayName("GET /api/v1/debts/overdue devuelve deudas vencidas con rol MANAGER")
    void listOverdue_returns200WhenManager() {
        CustomerDebt debt = buildDebt();
        CustomerDebtDto dto = sampleDto();
        when(queryPort.listOverdue()).thenReturn(Flux.just(debt));
        when(mapper.toDto(any(CustomerDebt.class))).thenReturn(dto);

        webTestClient.get()
            .uri("/api/v1/debts/overdue")
            .exchange()
            .expectStatus().isOk();
    }

    @Test
    @WithMockUser(roles = "SELLER")
    @DisplayName("GET /api/v1/debts/{id} devuelve deuda por id con rol SELLER")
    void getById_returns200WhenSeller() {
        CustomerDebt debt = buildDebt();
        CustomerDebtDto dto = sampleDto();
        when(queryPort.getById(debtId)).thenReturn(Mono.just(debt));
        when(mapper.toDto(any(CustomerDebt.class))).thenReturn(dto);

        webTestClient.get()
            .uri("/api/v1/debts/{id}", debtId)
            .exchange()
            .expectStatus().isOk()
            .expectBody()
            .jsonPath("$.id").isEqualTo(debtId.toString());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("POST /api/v1/debts/{id}/cancel cancela deuda con rol ADMIN")
    void cancel_returns200WhenAdmin() {
        CustomerDebt debt = buildDebt();
        CustomerDebtDto dto = sampleDto();
        when(commandPort.cancel(debtId)).thenReturn(Mono.just(debt));
        when(mapper.toDto(any(CustomerDebt.class))).thenReturn(dto);

        webTestClient.post()
            .uri("/api/v1/debts/{id}/cancel", debtId)
            .exchange()
            .expectStatus().isOk();
    }

    @Test
    @WithMockUser(roles = "SELLER")
    @DisplayName("POST /api/v1/debts/{id}/cancel devuelve 403 con rol SELLER")
    void cancel_returns403WhenSeller() {
        webTestClient.post()
            .uri("/api/v1/debts/{id}/cancel", debtId)
            .exchange()
            .expectStatus().isForbidden();
    }

    @Test
    @WithMockUser(roles = "SELLER")
    @DisplayName("POST /api/v1/debts/{id}/payments registra pago con rol SELLER")
    void registerPayment_returns200WhenSeller() {
        DebtPayment payment = new DebtPayment(
            UUID.randomUUID(), debtId, new BigDecimal("50.00"),
            DebtPayment.PaymentMethod.CASH, null, UUID.randomUUID(), Instant.now()
        );
        DebtPaymentDto paymentDto = new DebtPaymentDto(
            payment.id(), debtId, new BigDecimal("50.00"),
            "CASH", null, UUID.randomUUID(), Instant.now()
        );
        when(commandPort.registerPayment(any())).thenReturn(Mono.just(payment));
        when(mapper.toDto(any(DebtPayment.class))).thenReturn(paymentDto);

        webTestClient.post()
            .uri("/api/v1/debts/{id}/payments", debtId)
            .bodyValue("""
                {"amount": 50.00, "paymentMethod": "CASH"}
                """)
            .header("Content-Type", "application/json")
            .exchange()
            .expectStatus().isOk();
    }
}
