import NavBar from "@/components/NavBar";
import CreatePostForm from "@/components/forum/CreatePostForm";

export default function CreatePost() {
  return (
    <>
      <NavBar />
      <div className="container mx-auto py-6 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Share Location Condition</h1>
          <CreatePostForm />
        </div>
      </div>
    </>
  );
}
