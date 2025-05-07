import NavBar from "@/components/NavBar";
import PostList from "@/components/forum/PostList";

export default function Forum() {
  return (
    <>
      <NavBar />
      <div className="container mx-auto py-6 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Location Conditions Forum</h1>
          <PostList />
        </div>
      </div>
    </>
  );
}
