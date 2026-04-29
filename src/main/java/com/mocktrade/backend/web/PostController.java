package com.mocktrade.backend.web;


import com.mocktrade.backend.domain.post.Post;
import com.mocktrade.backend.domain.post.PostService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;

    // 모든 게시글 조회
    @GetMapping
    public ResponseEntity<List<Post>> getAllPosts() {
        return ResponseEntity.ok(postService.findAllPosts());
    }

    // 게시글 상세 조회
    @GetMapping("/{postId}")
    public ResponseEntity<Post> getPost(@PathVariable String postId) {
        return ResponseEntity.ok(postService.getPostDetail(postId));
    }

    // 게시글 작성 (@RequestBody 사용)
    @PostMapping
    public ResponseEntity<String> savePost(@RequestBody Post post) {
        return ResponseEntity.ok(postService.createPost(post));
    }

    // 좋아요 토글 (@PathVariable과 JSON 바디의 loginId 사용)
    @PostMapping("/{postId}/like")
    public ResponseEntity<Void> toggleLike(
            @PathVariable String postId,
            @RequestBody Map<String, String> body
    ) {
        postService.togglePostLike(postId, body.get("loginId"));
        return ResponseEntity.ok().build();
    }
}