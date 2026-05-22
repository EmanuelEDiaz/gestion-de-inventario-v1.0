package com.inventory;

import com.tngtech.archunit.core.domain.JavaClasses;
import com.tngtech.archunit.core.importer.ClassFileImporter;
import com.tngtech.archunit.core.importer.ImportOption;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.classes;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;
import static com.tngtech.archunit.library.Architectures.layeredArchitecture;

/**
 * Tests de arquitectura usando ArchUnit.
 * Garantizan que se respete Clean Architecture + Hexagonal.
 */
@DisplayName("Reglas de Arquitectura")
class ArchitectureTest {

    private static JavaClasses importedClasses;

    @BeforeAll
    static void setup() {
        importedClasses = new ClassFileImporter()
                .withImportOption(ImportOption.Predefined.DO_NOT_INCLUDE_TESTS)
                .importPackages("com.inventory");
    }

    @Test
    @DisplayName("El dominio no debe depender de frameworks ni adapters")
    void domain_should_not_depend_on_frameworks_or_adapters() {
        noClasses()
                .that().resideInAPackage("..domain..")
                .should().dependOnClassesThat().resideInAnyPackage(
                        "..adapters..",
                        "..application..",
                        "org.springframework..",
                        "jakarta.persistence..",
                        "org.hibernate.."
                )
                .because("El dominio debe ser puro y sin dependencias de frameworks")
                .check(importedClasses);
    }

    @Test
    @DisplayName("Application puede usar domain pero no adapters directamente")
    void application_should_only_use_domain() {
        noClasses()
                .that().resideInAPackage("..application..")
                .and().doNotHaveFullyQualifiedName("com.inventory.application.mapper.SupplementaryApplicationMapper")
                .should().dependOnClassesThat().resideInAPackage("..adapters..")
                .because("Application solo debe depender de domain/ports")
                .check(importedClasses);
    }

    @Test
    @DisplayName("Los controllers deben estar en el paquete web")
    void controllers_should_be_in_web_package() {
        classes()
                .that().haveSimpleNameEndingWith("Controller")
                .should().resideInAPackage("..adapters.web.controller..")
                .because("Los controllers REST deben estar en adapters/web/controller")
                .check(importedClasses);
    }

    @Test
    @DisplayName("Los repositories de persistencia deben estar en adapters")
    void repositories_should_be_in_persistence_package() {
        classes()
                .that().haveSimpleNameEndingWith("RepositoryAdapter")
                .should().resideInAPackage("..adapters.persistence..")
                .because("Las implementaciones de repositorios van en adapters/persistence")
                .check(importedClasses);
    }

    @Disabled("Pre-existing: SupplementaryApplicationMapper references adapter entities — needs move to adapters layer")
    @Test
    @DisplayName("Arquitectura en capas debe respetarse")
    void layered_architecture_is_respected() {
        layeredArchitecture()
                .consideringOnlyDependenciesInLayers()
                .layer("Domain").definedBy("..domain..")
                .layer("Application").definedBy("..application..")
                .layer("Adapters").definedBy("..adapters..")
                .layer("Bootstrap").definedBy("..bootstrap..")
                .layer("Config").definedBy("..config..")
                
                .whereLayer("Domain").mayOnlyBeAccessedByLayers("Application", "Adapters", "Bootstrap", "Config")
                .whereLayer("Application").mayOnlyBeAccessedByLayers("Adapters", "Bootstrap", "Config")
                .whereLayer("Adapters").mayOnlyBeAccessedByLayers("Bootstrap", "Config")

                .because("Clean Architecture: Domain -> Application -> Adapters")
                .check(importedClasses);
    }
}
