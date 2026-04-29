package com.mocktrade.backend.domain.member;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import jakarta.validation.constraints.NotBlank;

/**
 * MongoDB 회원 정보를 관리하는 Document 엔티티
 */
@Document(collection = "members") // MongoDB의 'members' 컬렉션과 매핑
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Member {

    @Id
    private String id; // MongoDB가 자동으로 할당하는 고유 ID (ObjectId와 매핑)

    @NotBlank(message = "아이디는 필수입니다")
    private String loginId;

    @NotBlank(message = "비밀번호는 필수입니다")
    private String password;

    private String name; // 프론트엔드 stock_app.jsx에서 사용하는 이름 필드 추가

    private Double balance; // 초기 자산 (예: 10,000,000.0)

    /**
     * 회원가입 시 필요한 최소 정보를 받는 생성자
     */
    //테스트용
    public Member(String loginId, String password, Double balance) {
        this.loginId = loginId;
        this.password = password;
        this.balance = balance;
    }
}