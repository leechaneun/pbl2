package com.mocktrade.backend.domain.stock;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

/**
 * 주식 및 사용자 계정 정보를 관리하는 MongoDB Document
 */
@Document(collection = "stocks")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Stock {
    @Id
    private String id;

    private String stockCode;
    private String stockName;
    private Long currentPrice;
    private Double changeRate;
    private LocalDateTime lastUpdated;

    // 테스트 코드에서 사용하기 위한 편리한 생성자
    public Stock(String stockCode, String stockName, Long currentPrice) {
        this.stockCode = stockCode;
        this.stockName = stockName;
        this.currentPrice = currentPrice;
        this.lastUpdated = LocalDateTime.now();
    }
}