import type {Edge, Node} from "reactflow";

export type WorkflowDataType = {
  nodes: Node[],
  edges: Edge[],
  readOnly: boolean,
  viewport: { x: number, y: number, zoom: number }
}

const sample = {

  "nodes": [
    {
      "id": "1775711823881",
      "type": "custom",
      "data": {
        "variables": [],
        "type": "start",
        "title": "開始",
        "selected": false
      },
      "position": {
        "x": 0,
        "y": 15
      },
      "targetPosition": "left",
      "sourcePosition": "right",
      "positionAbsolute": {
        "x": 0,
        "y": 15
      },
      "width": 242,
      "height": 73,
      "selected": false
    },
    {
      "id": "llm",
      "type": "custom",
      "data": {
        "model": {
          "provider": "langgenius/deepseek/deepseek", // ezchat/ai
          "name": "deepseek-chat", // model name (lite, core, pro)
          "mode": "chat",
          "completion_params": {
            "temperature": 0.7
          }
        },
        "prompt_template": [
          {
            "role": "system",
            "text": "{{#context#}}",
            "id": "62622fa9-da43-4d86-8e5e-c309b82e881a",
            "edition_type": "basic"
          }
        ],
        "context": {
          "enabled": true,
          "variable_selector": [
            "sys",
            "query"
          ]
        },
        "vision": {
          "enabled": false
        },
        "memory": {
          "window": {
            "enabled": false,
            "size": 10
          },
          "query_prompt_template": "{{#sys.query#}}\n\n{{#sys.files#}}",
          "role_prefix": {
            "user": "",
            "assistant": ""
          }
        },
        "selected": true,
        "type": "llm",
        "title": "LLM",
        "prompt_config": {
          "jinja2_variables": []
        }
      },
      "position": {
        "x": 342,
        "y": 8
      },
      "targetPosition": "left",
      "sourcePosition": "right",
      "positionAbsolute": {
        "x": 342,
        "y": 8
      },
      "width": 242,
      "height": 88,
      "selected": true
    },
    {
      "id": "answer",
      "type": "custom",
      "data": {
        "variables": [],
        "answer": "{{#llm.text#}}",
        "type": "answer",
        "title": "直接回覆",
        "selected": false
      },
      "position": {
        "x": 684,
        "y": 0
      },
      "targetPosition": "left",
      "sourcePosition": "right",
      "positionAbsolute": {
        "x": 684,
        "y": 0
      },
      "width": 242,
      "height": 103,
      "selected": false
    }
  ],
  "edges": [
    {
      "id": "llm-answer",
      "source": "llm",
      "sourceHandle": "source",
      "target": "answer",
      "targetHandle": "target",
      "type": "custom",
      "data": {
        "sourceType": "llm",
        "targetType": "answer"
      }
    },
    {
      "id": "1775711823881-source-llm-target",
      "type": "custom",
      "source": "1775711823881",
      "target": "llm",
      "sourceHandle": "source",
      "targetHandle": "target",
      "data": {
        "sourceType": "start",
        "targetType": "llm",
        "isInLoop": false
      },
      "zIndex": 0
    }
  ],
  "viewport": {
    "x": 219,
    "y": 574,
    "zoom": 0.7
  }
}
