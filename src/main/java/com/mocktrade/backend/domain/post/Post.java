package com.mocktrade.backend.domain.post;


import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.ArrayList;
import java.util.List;

@Document(collection = "posts")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Post {

    @Id
    private String postId;

    private String title;
    private String content;
    private String author;
    private String stockCode;
    private String stockName;
    private String position;
    private Double yield;

    private Long viewCount = 0L;
    private List<String> likedUsers = new ArrayList<>();

    @Builder
    public Post(String title, String content, String author, String stockCode, String stockName, String position, Double yield) {
        this.title = title;
        this.content = content;
        this.author = author;
        this.stockCode = stockCode;
        this.stockName = stockName;
        this.position = position;
        this.yield = yield;
    }

    // [비즈니스 로직] 조회수 증가
    public void incrementViewCount() {
        this.viewCount++;
    }

    // [비즈니스 로직] 좋아요 토글
    public void toggleLike(String loginId) {
        if (this.likedUsers.contains(loginId)) {
            this.likedUsers.remove(loginId);
        } else {
            this.likedUsers.add(loginId);
        }
    }
}