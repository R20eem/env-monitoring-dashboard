package com.envdashboard.backend.auth

import com.envdashboard.backend.security.JwtService
import com.envdashboard.backend.user.UserRepository
import org.springframework.http.ResponseEntity
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/auth")
class AuthController(
    private val users: UserRepository,
    private val encoder: PasswordEncoder,
    private val jwt: JwtService,
) {
    @PostMapping("/login")
    fun login(
        @RequestBody req: LoginRequest,
    ): ResponseEntity<LoginResponse> {
        val user = users.findByUsername(req.username) ?: return ResponseEntity.status(401).build()
        if (!encoder.matches(req.password, user.passwordHash)) return ResponseEntity.status(401).build()
        return ResponseEntity.ok(LoginResponse(token = jwt.createToken(user)))
    }
}

data class LoginRequest(
    val username: String,
    val password: String,
)

data class LoginResponse(
    val token: String,
)
