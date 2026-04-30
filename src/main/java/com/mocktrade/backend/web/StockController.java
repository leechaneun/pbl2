package com.mocktrade.backend.web;

import com.mocktrade.backend.domain.stock.Stock;
import com.mocktrade.backend.domain.stock.StockRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/stocks")
@RequiredArgsConstructor
@CrossOrigin(originPatterns = "*", allowCredentials = "true")
public class StockController {

    private final StockRepository stockRepository;

    /**
     * DB에 저장된 모든 주식 정보(실시간가 포함)를 반환합니다.
     * 리액트 프로토타입의 fetchStocks() 함수와 연결됩니다.
     */
    @GetMapping
    public List<Stock> getAllStocks() {
        return stockRepository.findAll();
    }
}