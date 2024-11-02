from typing import TypedDict, Annotated, Dict, Any, Optional, AsyncGenerator
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import MessageGraph, add_messages
from langchain_core.runnables import RunnableConfig
from langchain.callbacks import AsyncIteratorCallbackHandler
import asyncio
import logging 

from .queries import (
    summary_query,
    background_query,
    number_of_participants_query,
    study_procedures_query,
    alt_procedures_query,
    risks_query,
    benefits_query
)

from .rag_builder import RagBuilder

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AgentState(TypedDict):
    summary: Annotated[str, add_messages]
    background: Annotated[str, add_messages]
    number_of_participants: Annotated[str, add_messages]
    study_procedures: Annotated[str, add_messages]
    alt_procedures: Annotated[str, add_messages]
    risks: Annotated[str, add_messages]
    benefits: Annotated[str, add_messages]

class ClinicalTrialGraph:
    def __init__(self, rag_builder: RagBuilder, files: list[str] = []):
        logger.warning(f"Creating ClinicalTrialGraph with files: {files}")
        self.rag_chain = rag_builder.rag_chain if len(files) == 0 else rag_builder.get_rag_with_filters(files)
        self.compiled_graph = self._build_graph()

    def _build_graph(self):
        workflow = StateGraph(AgentState)

        # Define nodes for each section
        nodes = [
            ("summary_node", "summary"),
            ("background_node", "background"),
            ("number_of_participants_node", "number_of_participants"),
            ("study_procedures_node", "study_procedures"),
            ("alt_procedures_node", "alt_procedures"),
            ("risks_node", "risks"),
            ("benefits_node", "benefits")
        ]
        
        # Add nodes and connect them to START and END
        for node_name, state_key in nodes:
            workflow.add_node(node_name, getattr(self, node_name))
            workflow.add_edge(START, node_name)
            workflow.add_edge(node_name, END)

        # Set the entry point
        # workflow.set_entry_point("summary_node")

        return workflow.compile()

    async def streaming_node(self, state: AgentState, field: str, query: str) -> AsyncGenerator[Dict, None]:
        callback = AsyncIteratorCallbackHandler()
        runnable = self.rag_chain.with_config(callbacks=[callback])
        task = asyncio.create_task(runnable.ainvoke({"question": query()}))
        
        current_content = ""
        async for token in callback.aiter():
            current_content += token
          
            # Yield the entire current content for the field, simulating overwriting
            yield {field: current_content}
        
        await task

    async def summary_node(self, state: AgentState) -> AsyncGenerator[Dict, None]:
        async for update in self.streaming_node(state, "summary", summary_query):
            yield {"summary": [update["summary"]]}

    async def background_node(self, state: AgentState) -> AsyncGenerator[Dict, None]:
        async for update in self.streaming_node(state, "background", background_query):
            print(f"Received update: {update}")

            yield {"background": [update["background"]]}

    async def number_of_participants_node(self, state: AgentState) -> AsyncGenerator[Dict, None]:
        async for update in self.streaming_node(state, "number_of_participants", number_of_participants_query):
            yield {"number_of_participants": [update["number_of_participants"]]}

    async def study_procedures_node(self, state: AgentState) -> AsyncGenerator[Dict, None]:
        async for update in self.streaming_node(state, "study_procedures", study_procedures_query):
            yield {"study_procedures": [update["study_procedures"]]}

    async def alt_procedures_node(self, state: AgentState) -> AsyncGenerator[Dict, None]:
        async for update in self.streaming_node(state, "alt_procedures", alt_procedures_query):
            yield {"alt_procedures": [update["alt_procedures"]]}

    async def risks_node(self, state: AgentState) -> AsyncGenerator[Dict, None]:
        async for update in self.streaming_node(state, "risks", risks_query):
            yield {"risks": [update["risks"]]}

    async def benefits_node(self, state: AgentState) -> AsyncGenerator[Dict, None]:
        async for update in self.streaming_node(state, "benefits", benefits_query):
            yield {"benefits": [update["benefits"]]}

    async def astream(self, config: Optional[RunnableConfig] = None):
        targets = {
            "summary": "",
            "background": "",
            "number_of_participants": "",
            "study_procedures": "",
            "alternatives": "",
            "risks": "",
            "benefits": ""
        }
        async for update in self.compiled_graph.astream(targets, config, stream_mode="updates"):
            yield update