import { useEffect, useState } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { SiteProvider } from './siteData';
import SearchOverlay from './components/SearchOverlay';
import Home from './pages/Home';
import PostPage from './pages/PostPage';
import { AboutPage, ArchivePage, TagPage, TagsPage, WritingPage } from './pages/Lists';
import { NotFoundPage, WorkPage, WorksPage } from './pages/WorksPage';

function ScrollToTop() {
  const location = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [location.pathname]);
  return null;
}

export default function App() {
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const openSearch = () => setSearchOpen(true);

  return (
    <BrowserRouter>
      <SiteProvider>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Home onSearch={openSearch} />} />
          <Route path="/writing" element={<WritingPage onSearch={openSearch} />} />
          <Route path="/writing/:slug" element={<PostPage onSearch={openSearch} />} />
          <Route path="/archive" element={<ArchivePage onSearch={openSearch} />} />
          <Route path="/tags" element={<TagsPage onSearch={openSearch} />} />
          <Route path="/tag/:slug" element={<TagPage onSearch={openSearch} />} />
          <Route path="/about" element={<AboutPage onSearch={openSearch} />} />
          <Route path="/works" element={<WorksPage onSearch={openSearch} />} />
          <Route path="/work/:slug" element={<WorkPage onSearch={openSearch} />} />
          <Route path="*" element={<NotFoundPage onSearch={openSearch} />} />
        </Routes>
        <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
      </SiteProvider>
    </BrowserRouter>
  );
}
