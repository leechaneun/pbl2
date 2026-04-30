package com.mocktrade.backend.web;


import com.mocktrade.backend.domain.member.Member;
import com.mocktrade.backend.domain.member.MemberService;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindingResult;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

//검증,세션처리:유동균 mvc2 인강 강의 자료, ResponseEntity: https://burningfalls.github.io/java/what-is-response-entity/참고

@RestController
@RequestMapping("/user")
@CrossOrigin(origins = "*")
public class AuthController {

    private final MemberService memberService;

    public AuthController(MemberService memberService) {
        this.memberService = memberService;
    }

    /**
     * 회원가입
     * JSON 바디로 회원 정보를 받습니다.
     */
    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody Member member, BindingResult bindingResult) {
        if (bindingResult.hasErrors()) {
            return ResponseEntity.badRequest().body(bindingResult.getAllErrors());
        }

        // 초기 자산 1,000만 원 고정
        member.setBalance(10000000.0);

        try {
            Member savedMember = memberService.register(member);
            return ResponseEntity.ok(savedMember);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

  //로그인
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> loginData, HttpSession session) {
        String loginId = loginData.get("loginId");
        String password = loginData.get("password");

        try {
            Member member = memberService.login(loginId, password);

            if (member == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("아이디 또는 비밀번호가 틀렸습니다.");
            }

            // 보안을 위해 비밀번호 제거 후 세션 저장
            member.setPassword(null);
            session.setAttribute("loginMember", member);

            return ResponseEntity.ok(member);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(e.getMessage());
        }
    }

   //세션 정보 확인
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(HttpSession session) {
        Member loginMember = (Member) session.getAttribute("loginMember");
        if (loginMember == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("로그인이 필요합니다.");
        }
        return ResponseEntity.ok(loginMember);
    }

    //로그아웃
    @PostMapping("/logout")
    public ResponseEntity<String> logout(HttpSession session) {
        session.invalidate();
        return ResponseEntity.ok("로그아웃 성공");
    }
}