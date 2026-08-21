from rest_framework import serializers

from .models import KnowledgeDocument, Post
from .utilis import extract_document_text, generate_tags


class PostSerializer(serializers.ModelSerializer):
    class Meta:
        model = Post
        fields = ["id", "title", "description"]
        read_only_fields = ["id"]


class PostDetailSerializer(PostSerializer):
    tags = serializers.SerializerMethodField()

    class Meta(PostSerializer.Meta):
        fields = [*PostSerializer.Meta.fields, "tags"]

    def get_tags(self, obj):
        return generate_tags(obj.description)


class ChatMessageSerializer(serializers.Serializer):
    message = serializers.CharField(max_length=4000, trim_whitespace=True)
    history = serializers.ListField(
        child=serializers.DictField(), required=False, default=list, max_length=20
    )

    def validate_history(self, history):
        cleaned = []
        for item in history:
            role = item.get("role")
            content = item.get("content")
            if role not in {"user", "assistant"} or not isinstance(content, str):
                raise serializers.ValidationError("Each message needs a valid role and content.")
            cleaned.append({"role": role, "content": content[:4000]})
        return cleaned


class KnowledgeDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = KnowledgeDocument
        fields = ["id", "name", "size", "created_at"]
        read_only_fields = fields


class KnowledgeUploadSerializer(serializers.Serializer):
    file = serializers.FileField(write_only=True)

    def validate_file(self, uploaded_file):
        if uploaded_file.size > 5 * 1024 * 1024:
            raise serializers.ValidationError("Files must be 5 MB or smaller.")
        extension = uploaded_file.name.rsplit(".", 1)[-1].lower()
        if extension not in {"txt", "md", "pdf"}:
            raise serializers.ValidationError("Upload a TXT, Markdown, or PDF file.")
        return uploaded_file

    def create(self, validated_data):
        uploaded_file = validated_data["file"]
        content = extract_document_text(uploaded_file)
        if not content.strip():
            raise serializers.ValidationError({"file": "The file contains no readable text."})
        return KnowledgeDocument.objects.create(
            name=uploaded_file.name[:255],
            content=content,
            size=uploaded_file.size,
        )
