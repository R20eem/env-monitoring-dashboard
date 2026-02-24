package com.envdashboard.backend

import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status

@AutoConfigureMockMvc
@SpringBootTest
class BackendApplicationTests {

    @Autowired
    lateinit var mockMvc: MockMvc

    @Test
    fun contextLoads() {
        // verifies application context loads
    }

    @Test
    fun meWithoutTokenReturns401() {
        mockMvc.perform(get("/api/auth/me"))
            .andExpect(status().isUnauthorized)
    }

    @Test
    fun loginReturnsTokenAndMeWorks() {
        val loginJson = """{"username":"researcher","password":"research123"}"""

        val loginResult = mockMvc.perform(
            post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(loginJson),
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.token").exists())
            .andReturn()

        // Extract token without ObjectMapper (simple string parsing)
        val body = loginResult.response.contentAsString
        val token =
            body.substringAfter("\"token\":\"")
                .substringBefore("\"")

        mockMvc.perform(
            get("/api/auth/me")
                .header("Authorization", "Bearer $token"),
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.username").value("researcher"))
            .andExpect(jsonPath("$.role").value("RESEARCHER"))
    }
}
