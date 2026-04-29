package com.mocktrade.backend.web;

import com.mocktrade.backend.domain.member.Member;
import com.mocktrade.backend.domain.member.MemberRepository;
import com.mocktrade.backend.domain.myPage.MyPage;
import com.mocktrade.backend.domain.myPage.MyPageRepository;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/myPage")
@RequiredArgsConstructor
public class MyPageController {

    private final MyPageRepository myPageRepository;
    private final MemberRepository memberRepository;

    @GetMapping
    public ResponseEntity<?> getMyPageInfo(HttpSession session) {
        Member loginMember = (Member) session.getAttribute("loginMember");
        if (loginMember == null) return ResponseEntity.status(401).body("로그인이 필요합니다.");

        // 최신 잔액 정보와 보유 주식 리스트를 함께 응답
        Member member = memberRepository.findById(loginMember.getId()).orElseThrow();
        List<MyPage> myStocks = myPageRepository.findAllByMemberId(member.getId());

        Map<String, Object> response = new HashMap<>();
        response.put("balance", member.getBalance());
        response.put("myStocks", myStocks);

        return ResponseEntity.ok(response);
    }
}