import streamlit as st
import os

# 设置页面配置，使其尽可能利用屏幕空间
st.set_page_config(layout="wide", page_title="上汽奥迪打铁指标看板")

# 读取构建好的 React 单文件 HTML
def load_react_app():
    # 注意：这里假设你已经运行了 'npm run build' 并且生成了 dist/index.html
    # 在 Streamlit Cloud 上，你通常需要把本地编译好的 index.html 上传到仓库中
    html_file_path = os.path.join(os.path.dirname(__file__), "dist", "index.html")
    
    if os.path.exists(html_file_path):
        with open(html_file_path, "r", encoding="utf-8") as f:
            html_content = f.read()
            # 使用 Streamlit 组件展示 HTML，设置足够高的高度以避免滚动条
            st.components.v1.html(html_content, height=1200, scrolling=True)
    else:
        st.error("未找到构建文件 (dist/index.html)。请先在本地运行 'npm run build' 并将 dist 文件夹上传到仓库。")

if __name__ == "__main__":
    load_react_app()