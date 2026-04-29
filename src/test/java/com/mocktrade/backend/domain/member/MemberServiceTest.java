package com.mocktrade.backend.domain.member;


import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.*;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;

@SpringBootTest
// @Transactional은 MongoDB 단일 서버 환경에서 롤백을 지원하지 않으므로 제거합니다.
class MemberServiceTest {

    @Autowired
    private MemberService memberService;

    @Autowired
    private MemberRepository memberRepository; // DB 정리를 위해 주입



    @Test
    void RegisterAndFindTest() {
        // Given
        Member member = new Member("testUser", "1234", 10000.0);
        memberService.register(member);

        // When
        Member found = memberService.findByLoginId("testUser");

        // Then
        assertThat(found).isNotNull();
        assertThat(found.getLoginId()).isEqualTo("testUser");
        assertThat(found.getPassword()).isEqualTo("1234");
        assertThat(found.getBalance()).isEqualTo(10000.0);
    }

    @Test
    void registerTest() {
        // Given
        Member member1 = new Member("registerUser", "1111", 5000.0);
        memberService.register(member1);

        // When & Then
        Member member2 = new Member("registerUser", "2222", 3000.0);

        // 중복 가입 시 IllegalArgumentException이 발생하는지 확인
        assertThrows(IllegalArgumentException.class, () -> memberService.register(member2));
    }

    @Test
    void LoginTest() {
        // Given
        Member member = new Member("loginUser", "abcd", 2000.0);
        memberService.register(member);

        // When
        Member loginMember = memberService.login("loginUser", "abcd");

        // Then
        assertThat(loginMember).isNotNull();
        assertThat(loginMember.getLoginId()).isEqualTo("loginUser");
    }

    @Test
    void LoginFailTest() {
        // Given
        Member member = new Member("failUser", "pass", 1000.0);
        memberService.register(member);

        // Then: 비밀번호 틀림
        assertThrows(IllegalArgumentException.class, () -> memberService.login("failUser", "wrongPass"));

        // Then: 존재하지 않는 아이디
        assertThrows(IllegalArgumentException.class, () -> memberService.login("notExist", "pass"));
    }
}