package com.mocktrade.backend.web;


import com.mocktrade.backend.domain.post.Post;
import com.mocktrade.backend.domain.post.PostService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/posts")
@CrossOrigin(originPatterns = "*", allowCredentials = "true")
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;

    @GetMapping
    public ResponseEntity<List<Post>> getAllPosts() {
        return ResponseEntity.ok(postService.findAllPosts());
    }

    @GetMapping("/{postId}")
    public ResponseEntity<Post> getPost(@PathVariable String postId) {
        return ResponseEntity.ok(postService.getPostDetail(postId));
    }

    @PostMapping
    public ResponseEntity<String> savePost(@RequestBody Post post) {
        return ResponseEntity.ok(postService.createPost(post));
    }

    @PostMapping("/{postId}/like")
    public ResponseEntity<Void> toggleLike(@PathVariable String postId, @RequestBody Map<String, String> body) {
        postService.togglePostLike(postId, body.get("loginId"));
        return ResponseEntity.ok().build();
    }

    // [추가] 댓글 작성 API
    @PostMapping("/{postId}/comments")
    public ResponseEntity<Void> addComment(
            @PathVariable String postId,
            @RequestBody Map<String, String> body
    ) {
        postService.addComment(postId, body.get("content"), body.get("author"));
        return ResponseEntity.ok().build();
    }
}