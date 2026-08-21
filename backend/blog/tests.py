from unittest.mock import patch

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from rest_framework.test import APIClient

from .models import KnowledgeDocument, Post


class PostApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_create_post(self):
        response = self.client.post(
            "/api/posts/",
            {"title": "Local AI", "description": "Running language models locally."},
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(Post.objects.count(), 1)
        self.assertNotIn("tags", response.data)

    def test_cors_preflight_allows_vite_origins(self):
        for origin in ("http://localhost:5173", "http://127.0.0.1:5173"):
            with self.subTest(origin=origin):
                response = self.client.options(
                    "/api/posts/",
                    HTTP_ORIGIN=origin,
                    HTTP_ACCESS_CONTROL_REQUEST_METHOD="POST",
                    HTTP_ACCESS_CONTROL_REQUEST_HEADERS="content-type",
                )
                self.assertEqual(response.status_code, 200)
                self.assertEqual(response["Access-Control-Allow-Origin"], origin)

    def test_list_returns_all_published_posts_without_generating_tags(self):
        first = Post.objects.create(title="First", description="First description")
        second = Post.objects.create(title="Second", description="Second description")

        with patch("blog.serializers.generate_tags") as generate_tags_mock:
            response = self.client.get("/api/posts/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual([post["id"] for post in response.data], [second.id, first.id])
        self.assertTrue(all("tags" not in post for post in response.data))
        generate_tags_mock.assert_not_called()

    @patch("blog.serializers.generate_tags", return_value=["local-ai", "ollama", "llm"])
    def test_retrieve_post_includes_generated_tags(self, generate_tags_mock):
        post = Post.objects.create(title="Local AI", description="Running models locally.")
        response = self.client.get(f"/api/posts/{post.id}/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["tags"], ["local-ai", "ollama", "llm"])
        generate_tags_mock.assert_called_once_with(post.description)


class ChatApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    @patch(
        "blog.views.chat_with_ollama",
        return_value=("A local model reply.", ["guide.txt"]),
    )
    def test_chat_returns_model_reply(self, chat_mock):
        document = KnowledgeDocument.objects.create(
            name="guide.txt", content="Local product documentation.", size=28
        )
        response = self.client.post(
            "/api/chat/",
            {
                "message": "Hello",
                "history": [{"role": "assistant", "content": "Hi there"}],
            },
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.data,
            {"reply": "A local model reply.", "sources": ["guide.txt"]},
        )
        chat_mock.assert_called_once_with(
            message="Hello",
            history=[{"role": "assistant", "content": "Hi there"}],
            documents=[document],
        )

    def test_chat_rejects_empty_message(self):
        response = self.client.post("/api/chat/", {"message": ""}, format="json")
        self.assertEqual(response.status_code, 400)

    def test_chat_requires_knowledge_document(self):
        response = self.client.post("/api/chat/", {"message": "Hello"}, format="json")
        self.assertEqual(response.status_code, 400)
        self.assertIn("knowledge document", response.data["detail"])


class KnowledgeDocumentApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_upload_list_and_delete_text_document(self):
        upload = SimpleUploadedFile(
            "guide.txt",
            b"The support team is available Monday through Friday.",
            content_type="text/plain",
        )
        create_response = self.client.post(
            "/api/knowledge/", {"file": upload}, format="multipart"
        )

        self.assertEqual(create_response.status_code, 201)
        document = KnowledgeDocument.objects.get()
        self.assertEqual(document.name, "guide.txt")
        self.assertIn("Monday through Friday", document.content)

        list_response = self.client.get("/api/knowledge/")
        self.assertEqual(list_response.status_code, 200)
        self.assertEqual(list_response.data[0]["name"], "guide.txt")
        self.assertNotIn("content", list_response.data[0])

        delete_response = self.client.delete(f"/api/knowledge/{document.id}/")
        self.assertEqual(delete_response.status_code, 204)
        self.assertFalse(KnowledgeDocument.objects.exists())

    def test_upload_rejects_unsupported_file(self):
        upload = SimpleUploadedFile("image.png", b"not an image", content_type="image/png")
        response = self.client.post(
            "/api/knowledge/", {"file": upload}, format="multipart"
        )
        self.assertEqual(response.status_code, 400)
