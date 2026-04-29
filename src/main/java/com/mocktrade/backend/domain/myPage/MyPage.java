package com.mocktrade.backend.domain.myPage;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "my_pages")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MyPage {
    @Id
    private String id;
    private String memberId;   // 사용자 ID
    private String stockCode;  // 종목 코드
    private String stockName;  // 종목명
    private int quantity;      // 보유 수량
    private Double averagePrice; // 매수 평단가
}