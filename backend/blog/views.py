from openai import APIConnectionError, APIError
from rest_framework import mixins, status, viewsets
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.views import APIView
from rest_framework.response import Response

from .models import KnowledgeDocument, Post
from .serializers import (
    ChatMessageSerializer,
    KnowledgeDocumentSerializer,
    KnowledgeUploadSerializer,
    PostDetailSerializer,
    PostSerializer,
)
from .utilis import chat_with_ollama


class PostViewSet(viewsets.ModelViewSet):
    queryset = Post.objects.all().order_by("-id")

    def get_serializer_class(self):
        if self.action == "retrieve":
            return PostDetailSerializer
        return PostSerializer

    def retrieve(self, request, *args, **kwargs):
        try:
            return super().retrieve(request, *args, **kwargs)
        except (APIConnectionError, APIError, ValueError, KeyError) as exc:
            return Response(
                {"detail": f"Could not generate tags: {exc}"},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )


class ChatView(APIView):
    def post(self, request):
        serializer = ChatMessageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        documents = list(KnowledgeDocument.objects.all())
        if not documents:
            return Response(
                {"detail": "Upload at least one knowledge document before chatting."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            reply, sources = chat_with_ollama(
                documents=documents,
                **serializer.validated_data,
            )
            return Response({"reply": reply, "sources": sources})
        except (APIConnectionError, APIError, ValueError, KeyError) as exc:
            return Response(
                {"detail": f"Could not reach the chatbot: {exc}"},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )


class KnowledgeDocumentViewSet(
    mixins.ListModelMixin,
    mixins.CreateModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    queryset = KnowledgeDocument.objects.all()
    parser_classes = [MultiPartParser, FormParser]

    def get_serializer_class(self):
        if self.action == "create":
            return KnowledgeUploadSerializer
        return KnowledgeDocumentSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            document = serializer.save()
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(
            KnowledgeDocumentSerializer(document).data,
            status=status.HTTP_201_CREATED,
        )
