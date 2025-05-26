const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
// const bcrypt = require('bcrypt'); // 제거
// const session = require('express-session'); // 제거
const app = express();
const port = 3000;

app.use(express.static('public'));
app.use('/views', express.static(path.join(__dirname, 'views')));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// --- 세션 미들웨어 제거 (bcrypt, express-session 사용하지 않으므로) ---
// app.use(session({ ... }));

// --- 관리자 계정 정보 제거 ---
// const ADMIN_USERNAME = 'admin'; ...

// --- 방 목록 정의 ---
const rooms = [
    { id: 'daily', name: '일상방' },
    { id: 'humor', name: '유머방' },
    { id: 'game', name: '게임방' },
    { id: 'school', name: '학교방' },
    { id: 'chat', name: '수다방' },
    { id: 'free', name: '자유방' }
];

// --- 임시 게시글 데이터 (메모리 저장) ---
// 'reports' 필드 추가
let posts = [
    { id: 1, room: 'free', title: '첫 번째 자유 게시글입니다.', content: '<p>안녕하세요, <strong>옥탑방 커뮤니티</strong>입니다! 이 글은 텍스트 편집기로 작성되었습니다.</p><p><img src="https://via.placeholder.com/150" alt="예시 이미지"></p><p><a href="https://google.com">Google로 이동</a></p>', likes: 5, dislikes: 0, author: '익명', reports: 0 },
    { id: 2, room: 'humor', title: '웃긴 썰 하나 풀어봅니다.', content: '<p>어제 지하철에서 있었던 일인데...</p>', likes: 12, dislikes: 1, author: '익명', reports: 0 },
    { id: 3, room: 'game', title: '새로운 게임 출시 기대돼요!', content: '<p>이번에 나오는 <b>그 게임</b> 다들 기대하고 계신가요?</p>', likes: 8, dislikes: 0, author: '익명', reports: 0 },
    { id: 4, room: 'free', title: '익명으로 글을 써봅니다.', content: '<p>익명성이 보장되는 공간입니다. 자유롭게 의견을 나누세요.</p>', likes: 3, dislikes: 2, author: '익명', reports: 0 }
];
let nextPostId = 5;

// --- 임시 공지사항 데이터 ---
let notices = [
    { id: 1, title: '커뮤니티 오픈 공지', content: '<p>옥탑방 커뮤니티가 드디어 문을 열었습니다!</p>' },
    { id: 2, title: '이용 수칙 안내', content: '<p>1. 지나친 <b>욕설이나 비방 금지.<b/></p>\n<p>2. 도를 넘는 <b>정치적 드립 금지<b/>.</p>\n<p>3. <b>19금<b/> 글이나 관련된 <b>게시물 금지.<b/></p>/n<p>4. 모두 <b>평화롭게 대화<b/>하기.</p>'}
];

// --- 임시 댓글 데이터 ---
let comments = [
    { id: 1, postId: 1, parentId: null, author: '익명1', content: '첫 번째 게시글에 댓글을 답니다.', likes: 2, dislikes: 0 },
    { id: 2, postId: 1, parentId: null, author: '익명2', content: '좋은 정보 감사합니다!', likes: 3, dislikes: 0 },
    { id: 3, postId: 1, parentId: 2, author: '익명1', content: '저도 공감합니다!', likes: 1, dislikes: 0 },
    { id: 4, postId: 2, parentId: null, author: '익명3', content: '지하철 썰 더 풀어주세요!', likes: 5, dislikes: 0 },
    { id: 5, postId: 3, parentId: null, author: '게임좋아', content: '저도 엄청 기대돼요!', likes: 4, dislikes: 0 },
];
let nextCommentId = 6;

// --- 신고 임계치 설정 ---
const REPORT_THRESHOLD = 3; // 신고가 3회 이상 누적되면 삭제

// --- 라우팅 ---
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.get('/room/:roomName', (req, res) => {
    const roomName = req.params.roomName;
    const room = rooms.find(r => r.id === roomName);
    if (room) {
        res.sendFile(path.join(__dirname, 'views', 'room-posts.html'));
    } else {
        res.status(404).send('방을 찾을 수 없습니다.');
    }
});

app.get('/notice', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'notice.html'));
});

app.get('/write', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'write-post.html'));
});

app.get('/post/:id', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'post-detail.html'));
});

// --- 관리자 로그인 페이지 라우팅 제거 ---
// app.get('/admin-login', ...);


// --- API 엔드포인트 ---

app.get('/api/rooms', (req, res) => {
    res.json(rooms);
});

// 특정 방의 게시글 목록
app.get('/api/posts/:roomName', (req, res) => {
    const roomName = req.params.roomName;
    const filteredPosts = posts.filter(p => p.room === roomName).map(p => ({
        id: p.id,
        title: p.title,
        room: p.room,
        author: p.author
    })).reverse();
    res.json(filteredPosts);
});

// 특정 게시글 상세 내용
app.get('/api/post/:id', (req, res) => {
    const postId = parseInt(req.params.id);
    const post = posts.find(p => p.id === postId);
    if (post) {
        res.json(post);
    } else {
        res.status(404).json({ message: '게시글을 찾을 수 없습니다.' });
    }
});

// 새 게시글 작성
app.post('/api/posts', (req, res) => {
    const { title, content, room } = req.body;
    const author = '익명'; // 모든 글은 익명으로 작성

    if (title && content && room) {
        const isValidRoom = rooms.some(r => r.id === room);
        if (!isValidRoom) {
            return res.status(400).json({ message: '유효하지 않은 방을 선택했습니다.' });
        }
        // 'reports' 필드 추가
        const newPost = { id: nextPostId++, room, title, content, likes: 0, dislikes: 0, author: author, reports: 0 };
        posts.push(newPost);
        console.log('새 게시글 추가됨:', newPost);
        res.status(201).json({ message: '게시글이 성공적으로 작성되었습니다.', post: newPost });
    } else {
        res.status(400).json({ message: '제목, 내용, 방을 모두 선택해주세요.' });
    }
});

// --- 게시물 삭제 API (관리자 기능 제거) ---
// app.delete('/api/post/:id', ...);

app.get('/api/notices', (req, res) => {
    res.json(notices.reverse());
});

app.get('/api/comments/:postId', (req, res) => {
    const postId = parseInt(req.params.postId);
    const postComments = comments.filter(c => c.postId === postId);

    const topLevelComments = postComments.filter(c => c.parentId === null);
    const replies = postComments.filter(c => c.parentId !== null);

    const organizedComments = topLevelComments.map(comment => {
        return {
            ...comment,
            replies: replies.filter(reply => reply.parentId === comment.id)
                            .sort((a, b) => a.id - b.id)
        };
    }).sort((a, b) => a.id - b.id);

    res.json(organizedComments);
});

app.post('/api/comments', (req, res) => {
    const { postId, parentId, content } = req.body;
    const author = '익명'; // 모든 댓글은 익명으로 작성

    if (postId && content) {
        const newComment = {
            id: nextCommentId++,
            postId: parseInt(postId),
            parentId: parentId ? parseInt(parentId) : null,
            author: author,
            content: content,
            likes: 0,
            dislikes: 0
        };
        comments.push(newComment);
        console.log('새 댓글 추가됨:', newComment);
        res.status(201).json({ message: '댓글이 성공적으로 작성되었습니다.', comment: newComment });
    } else {
        res.status(400).json({ message: '게시글 ID와 내용을 입력해주세요.' });
    }
});

app.post('/api/post/:id/vote', (req, res) => {
    const postId = parseInt(req.params.id);
    const { type } = req.body;

    const post = posts.find(p => p.id === postId);

    if (!post) {
        return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' });
    }

    if (type === 'like') {
        post.likes++;
    } else if (type === 'dislike') {
        post.dislikes++;
    } else {
        return res.status(400).json({ message: '유효하지 않은 투표 타입입니다.' });
    }

    res.json({ message: '투표 성공', likes: post.likes, dislikes: post.dislikes });
});

app.post('/api/comment/:id/vote', (req, res) => {
    const commentId = parseInt(req.params.id);
    const { type } = req.body;

    const comment = comments.find(c => c.id === commentId);

    if (!comment) {
        return res.status(404).json({ message: '댓글을 찾을 수 없습니다.' });
    }

    if (type === 'like') {
        comment.likes++;
    } else if (type === 'dislike') {
        comment.dislikes++;
    } else {
        return res.status(400).json({ message: '유효하지 않은 투표 타입입니다.' });
    }

    res.json({ message: '투표 성공', likes: comment.likes, dislikes: comment.dislikes });
});

// --- 게시글 신고 API ---
app.post('/api/post/:id/report', (req, res) => {
    const postId = parseInt(req.params.id);
    const post = posts.find(p => p.id === postId);

    if (!post) {
        return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' });
    }

    post.reports = (post.reports || 0) + 1; // 신고 횟수 증가
    console.log(`게시글 (ID: ${postId}) 신고됨. 현재 신고 횟수: ${post.reports}`);

    if (post.reports >= REPORT_THRESHOLD) {
        // 신고 임계치를 넘으면 게시글 삭제
        const initialPostsLength = posts.length;
        posts = posts.filter(p => p.id !== postId);
        comments = comments.filter(c => c.postId !== postId); // 관련 댓글도 삭제
        console.log(`게시글 (ID: ${postId})이 신고 ${REPORT_THRESHOLD}회 누적으로 자동 삭제되었습니다.`);
        return res.json({ message: `게시글이 ${REPORT_THRESHOLD}회 신고 누적으로 삭제되었습니다.`, deleted: true });
    }

    res.json({ message: '게시글이 신고되었습니다.', reports: post.reports, deleted: false });
});

// --- 로그인/회원가입 관련 API 제거 ---
// app.post('/api/admin-login', ...);
// app.post('/api/logout', ...);
// app.get('/api/current-user', ...);


// 서버 시작
app.listen(port, () => {
    console.log(`옥탑방 커뮤니티 서버가 http://localhost:${port} 에서 실행 중입니다.`);
});