from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from database import engine, Base, get_db
import models
import schemas
from utils import generate_short_code, is_valid_alias
from fastapi.responses import RedirectResponse
from fastapi import HTTPException
from fastapi.middleware.cors import CORSMiddleware
import qrcode
import io
from fastapi.responses import StreamingResponse

Base.metadata.create_all(bind=engine)

app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "URL Shortener API is running"}

@app.post("/shorten", response_model=schemas.URLResponse)
def create_short_url(url: schemas.URLCreate, db: Session = Depends(get_db)):
    if url.custom_alias:
        if not is_valid_alias(url.custom_alias):
            raise HTTPException(
                status_code=400,
                detail="Alias must be 3-20 characters (letters, numbers, hyphens only)"
            )
        existing = db.query(models.URL).filter(models.URL.short_code == url.custom_alias).first()
        if existing:
            raise HTTPException(status_code=400, detail="That alias is already taken")
        short_code = url.custom_alias
    else:
        short_code = generate_short_code()

    new_url = models.URL(
        original_url=url.original_url,
        short_code=short_code
    )
    db.add(new_url)
    db.commit()
    db.refresh(new_url)

    return new_url

@app.get("/check-alias/{alias}")
def check_alias(alias: str, db: Session = Depends(get_db)):
    if not is_valid_alias(alias):
        return {"available": False, "reason": "invalid"}
    existing = db.query(models.URL).filter(models.URL.short_code == alias).first()
    return {"available": existing is None, "reason": "taken" if existing else None}
@app.get("/stats/{short_code}", response_model=schemas.URLResponse)
def get_stats(short_code: str, db: Session = Depends(get_db)):
    url_entry = db.query(models.URL).filter(models.URL.short_code == short_code).first()
    if not url_entry:
        raise HTTPException(status_code=404, detail="Short URL not found")
    return url_entry

@app.get("/qrcode/{short_code}")
def get_qr_code(short_code: str, db: Session = Depends(get_db)):
    url_entry = db.query(models.URL).filter(models.URL.short_code == short_code).first()
    if not url_entry:
        raise HTTPException(status_code=404, detail="Short URL not found")

    short_url = f"http://127.0.0.1:8000/{short_code}"

    qr = qrcode.make(short_url)
    buffer = io.BytesIO()
    qr.save(buffer, format="PNG")
    buffer.seek(0)

    return StreamingResponse(buffer, media_type="image/png")
    
@app.get("/{short_code}")
def redirect_to_url(short_code: str, db: Session = Depends(get_db)):
    url_entry = db.query(models.URL).filter(models.URL.short_code == short_code).first()

    if not url_entry:
        raise HTTPException(status_code=404, detail="Short URL not found")

    url_entry.clicks += 1
    db.commit()

    return RedirectResponse(url=url_entry.original_url)