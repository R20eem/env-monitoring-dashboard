package com.envdashboard.backend.user

import org.springframework.boot.CommandLineRunner
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.security.crypto.password.PasswordEncoder

@Configuration
class UserSeeder {
    @Bean
    fun seedUsers(
        repo: UserRepository,
        encoder: PasswordEncoder,
    ): CommandLineRunner =
        CommandLineRunner {
            val username = "researcher"

            if (repo.findByUsername(username) == null) {
                repo.save(
                    User(
                        username = username,
                        passwordHash = encoder.encode("research123")!!,
                        role = Role.RESEARCHER,
                    ),
                )
            }
        }
}
