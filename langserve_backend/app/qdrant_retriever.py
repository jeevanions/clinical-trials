from typing import List
from langchain_qdrant import QdrantVectorStore
from langchain_openai import OpenAIEmbeddings
from langchain_core.vectorstores import VectorStoreRetriever
from qdrant_client import QdrantClient
from qdrant_client.http.exceptions import UnexpectedResponse
from qdrant_client.http.models import (
    Distance,
    VectorParams,
    MatchAny,
    Filter,
    FieldCondition,
    MatchValue,
)
from .config import Config
# from dotenv import load_dotenv

# load_dotenv()
class QdrantRetrieverClient:
    def __init__(self, collection_name: str = Config.COLLECTION_NAME):
        """ Initialize the Qdrant client and create the collection if it does not exist. """
        print(f"Qdrant Collection Name: {Config.COLLECTION_NAME}")
        # self.client = QdrantClient(url=Config.QDRANT_URL)
        self.client = QdrantClient(":memory:")
        self.embebedding_model = OpenAIEmbeddings(model=Config.OPENAI_EMBEDDING_MODEL_NAME)
        self.collection_name = collection_name
        self.qdrant_vectorstore = None

        if not self.client.collection_exists(collection_name=self.collection_name):
            print(
                f"Collection '{self.collection_name}' does not exist. Creating new collection."
            )
            self.client.create_collection(
                collection_name=self.collection_name,
                vectors_config=VectorParams(
                    size=Config.OPENAI_EMBEDDING_MODEL_DIMENSION, distance=Distance.COSINE
                ),
            )

    def get_vectorstore(self) -> QdrantVectorStore:
        if not self.qdrant_vectorstore:
            self.qdrant_vectorstore = QdrantVectorStore(
                client=self.client, collection_name=self.collection_name, embedding=self.embebedding_model
            )
        return self.qdrant_vectorstore

    def get_retriever(self) -> VectorStoreRetriever:
        """ Create and return a VectorStoreRetriever. """
        qdrant_vectorstore = self.get_vectorstore()
        return qdrant_vectorstore.as_retriever()

    def get_retriever_with_filter(self, document_titles: List[str]) -> VectorStoreRetriever:
        """ Create and return a VectorStoreRetriever with a filter applied. """
        qdrant_vectorstore = self.get_vectorstore()
        print(f"Filtering by document titles: {document_titles}")
        retriever = qdrant_vectorstore.as_retriever(
            search_kwargs={
                'filter': Filter(
                    must=[
                        FieldCondition(
                            key="metadata.document_title",
                            match=MatchAny(any=document_titles)
                        )
                    ]
                ),
                'k': 15,                                       
            }
        )
        return retriever
