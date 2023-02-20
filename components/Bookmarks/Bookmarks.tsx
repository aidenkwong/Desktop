import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import { useEffect, useRef, useState } from "react";
import { MdAddCircleOutline } from "react-icons/md";

import AddbookmarkForm from "./AddBookmarkForm";
import Bookmark from "./Bookmark";
import ImportBookmarkInstruction from "./ImportBookmarkInstruction";

const Bookmarks = () => {
  const supabase = useSupabaseClient();
  const user = useUser();

  const [loading, setLoading] = useState(false);
  const [bookmarks, setBookmarks] = useState<Array<any>>([]);
  const [directory, setDirectory] = useState<string>("My Bookmarks");
  const [showAddBookmarkForm, setShowAddBookmarkForm] = useState(false);

  // useRef
  const bookmarksContainerRef = useRef<HTMLDivElement | null>(null);
  const bookmarksRef = useRef<Array<HTMLDivElement | null>>([]);
  const directoryRef = useRef<Array<HTMLButtonElement | null>>([]);

  // useContext

  const [allBookmarks, setAllBookmarks] = useState<Array<any>>(
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem(`${user?.id}_bookmarks`)!!) || [
          {
            name: "My Bookmarks",
            type: "folder",
            children: [],
          },
        ]
      : [
          {
            name: "My Bookmarks",
            type: "folder",
            children: [],
          },
        ]
  );

  useEffect(() => {
    if (!user?.id) return;
    // Fetch bookmarks from supabase
    const fetchBookmarks = async () => {
      const { data, error } = await supabase
        .from("bookmark")
        .select("bookmark")
        .eq("user_id", user.id)
        .single();

      if (error) {
        console.error(error);
        return;
      }

      if (data) {
        setAllBookmarks(data.bookmark);
      } else {
        setAllBookmarks([
          {
            name: "My Bookmarks",
            type: "folder",
            children: [],
          },
        ]);
      }
    };

    fetchBookmarks();
  }, [supabase, user]);

  useEffect(() => {
    if (!user?.id || !allBookmarks) return;

    setLoading(true);

    // Update bookmarks in supabase
    (async () => {
      localStorage.setItem(
        `${user.id}_bookmarks`,
        JSON.stringify(allBookmarks)
      );
      const { error } = await supabase
        .from("bookmark")
        .upsert({ user_id: user.id, bookmark: allBookmarks });

      if (error) {
        const { error: error2 } = await supabase
          .from("bookmark")
          .update({ bookmark: allBookmarks })
          .eq("user_id", user.id);

        if (error2) {
          console.error(error2);
        }
      }
    })();

    setLoading(false);
  }, [allBookmarks, supabase, user?.id]);

  useEffect(() => {
    // Reorder the bookmarks in current directory
    setBookmarks((prev) => prev.sort((a, b) => a.type.localeCompare(b.type)));
  }, [bookmarks]);

  // add event listeners and refs
  useEffect(() => {
    let dragStartKey: string;

    // Start of event listener functions for drag-and-drop api
    const handleDragStart = (e: any) => {
      const el = e.currentTarget;

      dragStartKey = el.getAttribute("data-key");
      let crt = el.cloneNode(true);

      crt.setAttribute("id", "crt");
      crt.classList = "";
      // classList for the dragging element
      crt.classList.add(
        "w-44",
        "h-fit",
        "bg-foreground2",
        "border-edge",
        "border-2",
        "absolute",
        "-top-64",
        "-left-64",
        "rounded"
      );
      document.body.appendChild(crt);
      e.dataTransfer.setDragImage(crt, 0, 0);
    };

    const handleDragEnd = (_e: any) => {
      document.getElementById("crt")?.remove();
    };

    const handleDragLeave = (e: any) => {
      e.preventDefault();
      const el = e.currentTarget;

      if (el.classList.contains("folder")) {
        el.classList.replace("border-edge", "border-foreground2");
      }

      if (el.classList.contains("directory")) {
        el.classList.replace("border-edge", "border-transparent");
        // effect removed
      }
    };

    const handleDragOver = (e: any) => {
      e.preventDefault();
      const el = e.currentTarget;

      if (el.classList.contains("folder")) {
        el.classList.replace("border-foreground2", "border-edge");
      }
      if (
        el.classList.contains("directory") &&
        el.getAttribute("data-key") !== directory
      ) {
        el.classList.replace("border-transparent", "border-edge");
        // effect removed
      }
    };

    const handleDrop = (e: any) => {
      e.preventDefault();
      const el = e.currentTarget;
      const dropKey = e.currentTarget.getAttribute("data-key");

      if (el.classList.contains("folder")) {
        el.classList.replace("border-edge", "border-foreground2");
      }
      if (el.classList.contains("directory")) {
        el.classList.replace("border-edge", "border-transparent");
        // effect removed
      }

      if (dropKey === directory) return;

      const movedbookmark = bookmarks.find(
        (bookmark) =>
          bookmark.name ===
          dragStartKey.split("/")[dragStartKey.split("/").length - 1]
      );

      let tmpAllBookmarks = allBookmarks;

      const dfs = (
        arr: any[],
        startKey: string,
        dropKey: string,
        depth: number
      ) => {
        const startKeyArr = startKey.split("/");
        const dropKeyArr = dropKey.split("/");

        let curDirArr: string[] = [];

        if (startKeyArr.length > dropKeyArr.length) {
          curDirArr = startKeyArr.slice(0, depth + 1);
        } else {
          curDirArr = dropKeyArr.slice(0, depth + 1);
        }

        if (curDirArr.join("/") === dropKeyArr.join("/")) {
          let duplicateCount = 0;

          for (const bookmark of arr) {
            const duplicate = bookmark.name === movedbookmark.name;
            const duplicateWithNumber = bookmark.name
              .match(/\((\d+)\)/)
              ?.input.slice(0, -3);

            if (duplicate || duplicateWithNumber) {
              duplicateCount++;
            }
          }
          movedbookmark.name =
            duplicateCount == 0
              ? movedbookmark.name
              : `${movedbookmark.name} (${duplicateCount})`;

          arr.push(movedbookmark);
          arr.sort((a, b) => {
            return a.type.localeCompare(b.type);
          });
          setBookmarks(arr);
        }

        if (startKeyArr.length - curDirArr.length === 1) {
          const idx = arr.findIndex((v) => {
            return v.name === startKeyArr[startKeyArr.length - 1];
          });

          arr.splice(idx, 1);
          arr.sort((a, b) => {
            return a.type.localeCompare(b.type);
          });
        }
        depth++;
        if (startKeyArr.length > dropKeyArr.length) {
          curDirArr = startKeyArr.slice(0, depth + 1);
        } else {
          curDirArr = dropKeyArr.slice(0, depth + 1);
        }
        for (let i = 0; i < arr.length; i++) {
          if (
            arr[i].name === curDirArr[curDirArr.length - 1] &&
            arr[i].children
          ) {
            dfs(arr[i].children, startKey, dropKey, depth);
          }
        }
      };

      dfs(tmpAllBookmarks[0].children, dragStartKey, dropKey, 0);

      setAllBookmarks([...tmpAllBookmarks]);
    };
    // End of event listener functions for DND API

    // Set the bookmarks in current directory
    let tmpbookmarks = [...allBookmarks];
    const directoryArr = directory.split("/");

    for (let i = 0; i < directoryArr.length; i++) {
      const idx = tmpbookmarks.findIndex(
        (bookmark) =>
          bookmark.name === directoryArr[i] && bookmark.type === "folder"
      );

      if (idx === -1) return;
      tmpbookmarks = tmpbookmarks[idx].children;
    }
    tmpbookmarks.sort((a, b) => {
      return a.type.localeCompare(b.type);
    });
    setBookmarks(tmpbookmarks);

    // Populate the refs to bookmarks
    bookmarksRef.current = bookmarksRef?.current?.slice(0, bookmarks.length);

    // Add event listeners to bookmark nodes
    for (let i = 0; i < bookmarks.length; i++) {
      if (bookmarks[i].type === "url") {
        bookmarksRef.current[i]?.addEventListener("dragstart", handleDragStart);
        bookmarksRef.current[i]?.addEventListener("dragend", handleDragEnd);
      }
      if (bookmarks[i].type === "folder") {
        bookmarksRef.current[i]?.addEventListener("dragleave", handleDragLeave);
        bookmarksRef.current[i]?.addEventListener("drop", handleDrop);
      }

      bookmarksRef.current[i]?.addEventListener("dragover", handleDragOver);
    }

    // Populate the refs to directories
    directoryRef.current = directoryRef?.current?.slice(0, directory.length);

    // Add event listeners to directory nodes
    for (let i = 0; i < directory.length; i++) {
      directoryRef.current[i]?.addEventListener("dragover", handleDragOver);
      directoryRef.current[i]?.addEventListener("dragleave", handleDragLeave);
      directoryRef.current[i]?.addEventListener("drop", handleDrop);
    }

    // Remove event listeners when unmounting
    return () => {
      for (let i = 0; i < bookmarks.length; i++) {
        if (bookmarks[i].type === "url") {
          bookmarksRef.current[i]?.removeEventListener(
            "dragstart",
            handleDragStart
          );
          bookmarksRef.current[i]?.removeEventListener(
            "dragend",
            handleDragEnd
          );
        }
        if (bookmarks[i].type === "folder") {
          bookmarksRef.current[i]?.removeEventListener(
            "dragleave",
            handleDragLeave
          );
          bookmarksRef.current[i]?.removeEventListener("drop", handleDrop);
        }

        bookmarksRef.current[i]?.removeEventListener(
          "dragover",
          handleDragOver
        );
      }
      for (let i = 0; i < directory.length; i++) {
        directoryRef.current[i]?.removeEventListener(
          "dragover",
          handleDragOver
        );
        directoryRef.current[i]?.removeEventListener(
          "dragleave",
          handleDragLeave
        );
        directoryRef.current[i]?.removeEventListener("drop", handleDrop);
      }
    };
  }, [allBookmarks, directory, bookmarks]);

  // functions
  const deleteBookmark = async (key: string) => {
    let tmpAllBookmarks = [...allBookmarks];
    const dfs = (arr: any[], key: string, depth: number) => {
      const keyArr = key.split("/");
      let curDirArr: string[] = [];

      curDirArr = keyArr.slice(0, depth + 1);

      if (keyArr.length - curDirArr.length === 1) {
        const idx = arr.findIndex((v) => {
          return v.name === keyArr[keyArr.length - 1];
        });

        arr.splice(idx, 1);
      }

      depth++;
      curDirArr = keyArr.slice(0, depth + 1);
      for (let i = 0; i < arr.length; i++) {
        if (
          arr[i].name === curDirArr[curDirArr.length - 1] &&
          arr[i].children
        ) {
          dfs(arr[i].children, key, depth);
        }
      }
    };

    dfs(tmpAllBookmarks[0].children, key, 0);

    setAllBookmarks(tmpAllBookmarks);
  };

  // Emit when user upload "Bookmarks" file
  const fileOnChange = async (e: any) => {
    const file = e.target.files[0];
    const fileJson = JSON.parse(await file.text());

    setAllBookmarks([
      {
        name: "My Bookmarks",
        children: fileJson.roots.bookmark_bar.children,
        type: "folder",
      },
    ]);
  };

  return (
    <>
      <div className="hover:resize rounded border border-neutral-500 p-2 my-2 overflow-auto min-w-[196px]">
        <div className="my-2" ref={bookmarksContainerRef}>
          <div className="grid gap-2 grid-cols-auto-180">
            <div className="col-span-full flex justify-between">
              <div>
                {directory.split("/").map((dir, index) => (
                  <span key={index} className="my-2">
                    {index !== 0 && <i className="text-content">{"  >  "}</i>}
                    <button
                      className={`directory ${
                        index !== directory.split("/").length - 1 &&
                        "hover:bg-foreground2Hover"
                      }  px-3 py-1 rounded-full bg-foreground2 text-content border-2 border-transparent`}
                      data-key={directory
                        .split("/")
                        .slice(0, index + 1)
                        .join("/")}
                      ref={(el) => (directoryRef.current[index] = el)}
                      key={index}
                      onClick={() =>
                        setDirectory(
                          directory
                            .split("/")
                            .slice(0, index + 1)
                            .join("/")
                        )
                      }
                      disabled={index === directory.split("/").length - 1}
                    >
                      {dir}
                    </button>
                  </span>
                ))}
              </div>
            </div>
            {bookmarks.map((bookmark: any, index) => (
              <Bookmark
                bookmarksRef={bookmarksRef}
                directory={directory}
                setDirectory={setDirectory}
                key={index}
                dataKey={directory + "/" + bookmark.name}
                name={bookmark.name}
                type={bookmark.type}
                url={bookmark.url}
                deleteBookmark={deleteBookmark}
                loading={loading}
                index={index}
                setBookmarks={setBookmarks}
              />
            ))}
            <div
              onClick={() => {
                setShowAddBookmarkForm(true);
              }}
              className="w-fit h-fit p-4 bg-foreground2 hover:bg-foreground2Hover flex justify-center items-center rounded opacity-30 cursor-pointer"
            >
              Add shortcut or folder
              <MdAddCircleOutline size={24} />
            </div>
            <AddbookmarkForm
              setShowAddBookmarkForm={setShowAddBookmarkForm}
              showAddBookmarkForm={showAddBookmarkForm}
              bookmarks={bookmarks}
              allBookmarks={allBookmarks}
              setAllBookmarks={setAllBookmarks}
              directory={directory}
            />
          </div>
        </div>
      </div>
      <p>
        Import your bookmarks from your browser.{" "}
        <input type="file" onChange={fileOnChange} />
      </p>
      <ImportBookmarkInstruction />
    </>
  );
};

export default Bookmarks;
