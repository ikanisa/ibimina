pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}

dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "StaffAdmin"

include(":app")
include(":core:ui")
include(":core:data")
include(":core:domain")
include(":core:network")
include(":core:database")
include(":feature:auth")
include(":feature:dashboard")
include(":feature:users")
include(":feature:orders")
include(":feature:tickets")
include(":feature:settings")
