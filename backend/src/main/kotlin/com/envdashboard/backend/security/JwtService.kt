package com.envdashboard.backend.security

import com.envdashboard.backend.user.User
import io.jsonwebtoken.Jwts
import io.jsonwebtoken.security.Keys
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service
import java.time.Instant
import java.util.Date

@Service
class JwtService(
    @Value("\${security.jwt.secret}") secret: String,
) {
    private val key = Keys.hmacShaKeyFor(secret.toByteArray())

    fun createToken(user: User): String {
        val now = Instant.now()
        val expiry = now.plusSeconds(3600)

        return Jwts
            .builder()
            .subject(user.username)
            .issuedAt(Date.from(now))
            .expiration(Date.from(expiry))
            .claim("role", user.role.name)
            .signWith(key, io.jsonwebtoken.SignatureAlgorithm.HS256)
            .compact()
    }
}
