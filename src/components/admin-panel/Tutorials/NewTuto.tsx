import React, { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import Select from "react-select";
import { Navbar } from "../navbar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { TagInput, Tag } from "emblor";
import { Switch } from "../../ui/switch";
import { useTechStore } from "../../../hooks/techStore";
import { useTutoStore } from "@/hooks/tutoStore";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect } from "react";
import EditorComp from "../EditorComp/EditorComp";
import slugify from "slugify";

const Slug = z
  .string()
  .min(3, { message: "Slug must be at least 3 characters." })
  .max(60, { message: "Slug must not exceed 60 characters." })
  .regex(/^[a-z0-9-]+$/, {
    message: "Slug can only contain lowercase letters, numbers, and hyphens.",
  });

export const formSchema = z.object({
  title: z
    .string()
    .min(3, { message: "Title must have at least 3 characters." }),
  slug: Slug,
  content: z
    .string()
    .min(5, { message: "Content must have at least 5 characters." }),
  resume: z
    .string()
    .min(5, { message: "resume must have at least 5 characters." }),
  meta_title: z
    .string()
    .min(5, { message: "meta_title must have at least 5 characters." }),
  meta_description: z
    .string()
    .min(5, { message: "meta_description must have at least 5 characters." }),
  meta_keywords: z.array(z.object({ id: z.string(), text: z.string() })),
  video_url: z.string().url({ message: "Enter Valid Url" }),
  image: z.string().optional(),
  status: z.boolean().default(false),
  publish: z.boolean().default(false),
  created_at: z.string().optional(),
  level:z.string(),
  difficulty:z.number(),
  technologies: z.array(
    z.object({
      id: z.number(),
      name: z.string(),
    })
  ),
  defaultTechnology:z.string().optional(),
});

interface FormProps {
  initialData?: {
    id?: string;
    title: string;
    slug: string;
    content: string;
    resume: string;
    meta_title: string;
    meta_description: string;
    meta_keywords: Tag[];
    video_url: string;
    image: string;
    publish: boolean;
    status: boolean;
    created_at: string;
    technologies: { id: number; name: string }[];
    defaultTechnology:string;
    level:string;
    difficulty:number;
  };
  onSubmit: (data: z.infer<typeof formSchema>) => void;
}
export const Test = ({ initialData, onSubmit }: FormProps) => {
  const [tags, setTags] = React.useState<Tag[]>(
    initialData?.meta_keywords || []
  );
  const [activeTagIndex, setActiveTagIndex] = React.useState<number | null>(
    null
  );
  const [isActive, setIsActive] = useState(initialData?.status || false);
  const [isPublished, setIsPublished] = useState(initialData?.publish || false);
  const [selectedImage, setSelectedImage] = useState<string | null>(
    initialData?.image || null
  );

  const { techs } = useTechStore();
  const { id } = useParams<{ id: string }>();
  


  const { toast } = useToast();
  const navigate = useNavigate();

  const addTutorial = useTutoStore((state) => state.addTutorial);
  const editTutorial = useTutoStore((state) => state.editTutorial);

  // Extract unique technologies from all tutorials
  const technologies = techs.map((tech) => ({
    value: tech.id.toString(),
    label: tech.name,
  }));

   const levelOptions = [
     { value: "beginner", label: "Beginner" },
     { value: "intermediary", label: "Intermediary" },
     { value: "advanced", label:"Advanced"},
     { value: "expert", label: "Expert" },

   ];

   const difficultyOptions = Array.from({ length: 10 }, (_, i) => ({
     value: i + 1,
     label: (i + 1).toString(),
   }));
  

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: initialData?.title || "",
      slug: initialData?.slug || "",
      content: initialData?.content || "",
      resume: initialData?.resume || "",
      meta_title: initialData?.meta_title || "",
      meta_description: initialData?.meta_description || "",
      meta_keywords: initialData?.meta_keywords || [],
      level: initialData?.level || "beginner",
      difficulty: initialData?.difficulty || 1,
      video_url: initialData?.video_url || "",
      image: initialData?.image || "",
      publish: initialData?.publish || false,
      status: initialData?.status || false,
      created_at: initialData?.created_at || new Date().toISOString(),
      technologies: initialData?.technologies || [],
      defaultTechnology: initialData?.defaultTechnology || "",
    },
  });
  useEffect(() => {
    if (id) {
      // Edit mode: Find and set the technology data
      const tutoToEdit = useTutoStore
        .getState()
        .tutorials.find((tuto: { id: number }) => tuto.id === Number(id));
      if (tutoToEdit) {
        form.reset({
          ...tutoToEdit,
          meta_keywords: tutoToEdit.meta_keywords.map((keyword) => ({
            id: keyword.id.toString(),
            text: keyword.name,
          })),
          technologies: tutoToEdit.technologies.map((tech) => ({
            id: tech.id,
            name: tech.name,
          })),
        });
        console.log("Selected Image:", selectedImage);
        setSelectedImage(tutoToEdit.image || null);
        setTags(
          tutoToEdit.meta_keywords.map((keyword) => ({
            id: keyword.id.toString(),
            text: keyword.name,
          }))
        );
        setIsActive(tutoToEdit.status);
        setIsPublished(tutoToEdit.publish);
      }
    }
  }, [id, form]);

  useEffect(() => {
    const title = form.watch("title");
    const slug = form.watch("slug");

    if (
      title &&
      (!id ||
        slug === "" ||
        slug ===
          slugify(form.getValues("title"), { lower: true, strict: true }))
    ) {
      const generatedSlug = slugify(title, {
        lower: true,
        strict: true,
      });
      form.setValue("slug", generatedSlug);
    }
  }, [form.watch("title")]);

  // Handle image change
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Image = reader.result as string;
        setSelectedImage(base64Image);
        localStorage.setItem("tutoImage", base64Image);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (data: z.infer<typeof formSchema>) => {
    const tutorialData = {
      ...data,
      id: id ? parseInt(id) : Date.now(),
      technology_id: data.technologies[0]?.id || 0,
      meta_keywords: data.meta_keywords.map((keyword) => ({
        id: parseInt(keyword.id),
        name: keyword.text,
      })),
      image: selectedImage || "",
      defaultTechnology: data.defaultTechnology || "", // Ensure defaultTechnology is a string
    };

    if (id) {
      editTutorial(parseInt(id), tutorialData);
    } else {
      addTutorial(tutorialData);
    }
    toast({
      description: `Tutorial ${id ? "updated" : "added"} successfully!`,
    });
    navigate("/tutorials/all-tutorials"); // Navigate to tutorials list after submission
  };

  return (
    <div>
      <div className="pb-5">
        <Navbar title={id ? "Edit Tutorial" : "New Tutorial Form"} />
        <div className="flex justify-center bg-gray-100 p-2 rounded-lg shadow-xl  text-cyan-900 text-center ">
          <h1 className="text-2xl font-bold mt-3 text-center ">
            {id ? "Edit Tutorial" : "Add A New Tutorial"}
          </h1>
        </div>
      </div>
      <div>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-5 bg-grey p-2 rounded-lg shadow-md "
          >
            <div className="border-2 border-gray-300 rounded-lg p-2 m-2 pb-5 divide-y divide-blue-200">
              <h3 className="text-cyan-900 font-bold font-serif pt-1 mb-1 ">
                Textual Aspect
              </h3>

              <div className="grid grid-cols-2 gap-4 pt-5">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-semibold">
                        Title
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Enter tutorial name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-semibold">
                        Slug
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Enter tutorial slug" {...field} 
                        readOnly
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="meta_title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-semibold">
                        Meta_title
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter tutorial meta_title"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="meta_description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-semibold">
                        Meta_description
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter tutorial meta_description"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Add the level select */}
                <FormField
                  control={form.control}
                  name="level"
                  render={(
                    { field } // Added render prop
                  ) => (
                    <FormItem className="z-10">
                      <FormLabel className="text-gray-700 font-semibold">
                        Level
                      </FormLabel>
                      <FormControl>
                        <Select
                          options={levelOptions}
                          defaultValue={levelOptions.find(
                            (option) => option.value === field.value // Use field.value instead of form.getValues
                          )}
                          onChange={(selectedOption) =>
                            field.onChange(selectedOption?.value || "beginner")
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Add the difficulty select */}
                <FormField
                  control={form.control}
                  name="difficulty"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Difficulty</FormLabel>
                      <FormControl>
                        <Select
                          options={difficultyOptions}
                          defaultValue={difficultyOptions.find(
                            (option) =>
                              option.value === form.getValues("difficulty")
                          )}
                          onChange={(selectedOption) =>
                            form.setValue(
                              "difficulty",
                              selectedOption?.value || 1
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormItem>
                  <FormLabel className="text-gray-700 font-semibold">
                    Content
                  </FormLabel>
                  <FormControl>
                    <EditorComp name="content" />
                  </FormControl>
                  <FormMessage />
                </FormItem>

                <FormField
                  control={form.control}
                  name="resume"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-semibold ">
                        Resume
                      </FormLabel>
                      <FormControl>
                        <textarea
                          {...field}
                          className="w-full bg-slate-100"
                          cols={50}
                          rows={15}
                          placeholder="Enter Resume"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="meta_keywords"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-semibold">
                        Meta Keywords
                      </FormLabel>
                      <FormControl>
                        <TagInput
                          {...field}
                          placeholder="Enter a keyword"
                          tags={tags}
                          setTags={(newTags) => {
                            setTags(newTags);
                            form.setValue(
                              "meta_keywords",
                              (newTags as Tag[]).map((tag: Tag) => ({
                                id: tag.id,
                                text: tag.text,
                              }))
                            );
                          }}
                          activeTagIndex={activeTagIndex}
                          setActiveTagIndex={setActiveTagIndex}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            <div className="border-2 border-gray-300 rounded-lg p-2 m-2 pb-5 divide-y divide-blue-200 ">
              <h3 className="text-cyan-900 font-bold font-serif  mb-2 ">
                Status/Media
              </h3>
              <div className="flex flex-col gap-3 pt-5  space-y-5">
                {/* Video_url field */}
                <FormField
                  control={form.control}
                  name="video_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-semibold">
                        Video_url
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter/Paste url here!!"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* Display Selected Image */}
                {selectedImage && (
                  <div className="mt-4">
                    <img
                      src={selectedImage}
                      alt="Selected"
                      className="w-auto h-auto"
                    />
                  </div>
                )}

                {/* Image field */}
                <FormField
                  control={form.control}
                  name="image"
                  render={() => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-semibold">
                        Image File
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex flex-row gap-3">
                  {/* Active toggle (Switch) */}
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel
                          className={`text-gray-700 font-light font-serif mr-3 text-sm ${
                            isActive ? "text-green-400" : "text-gray-500"
                          }`}
                        >
                          {isActive ? "Active" : "Not active"}
                        </FormLabel>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={(checked) => {
                              field.onChange(checked);
                              setIsActive(checked); // Change label based on active state
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="publish"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel
                          className={`text-gray-700 font-light font-serif text-sm mr-3  ${
                            isPublished ? "text-green-400" : "text-gray-400"
                          }`}
                        >
                          {isPublished ? "Published" : "Not published"}
                        </FormLabel>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={(checked) => {
                              field.onChange(checked);
                              setIsPublished(checked); // Change label based on publish state
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>
            <div className="border-2 border-gray-300 rounded-lg p-2 m-2 pb-5 divide-y divide-blue-200">
              <h3 className="text-cyan-900 font-bold font-serif  mb-2  ">
                Dependencies
              </h3>
              <div className="flex flex-col gap-3 pt-5 space-y-5">
                <FormField
                  control={form.control}
                  name="technologies"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-semibold">
                        Technologies
                      </FormLabel>
                      <Select
                        {...field}
                        options={technologies}
                        isMulti={true}
                        placeholder="Select technologies"
                        onChange={(options) =>
                          field.onChange(
                            options.map((option) => ({
                              id: Number(option.value),
                              name: option.label,
                            }))
                          )
                        }
                        value={field.value.map((tech) => ({
                          value: tech.id.toString(),
                          label: tech.name,
                        }))}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="defaultTechnology"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-semibold">
                        Default Technology
                      </FormLabel>
                      <Select
                        {...field}
                        options={technologies}
                        onChange={(option) =>
                          field.onChange({
                            id: Number(option?.value), // Use optional chaining operator (?.)
                            name: option?.label,
                          })
                        }
                        value={
                          field.value
                            ? {
                                value: (field.value as { id: number } | string) // Allow string type
                                  .toString(), // Convert to string

                                label:
                                  typeof field.value === "string"
                                    ? ""
                                    : (field.value as { name: string }).name, // Check type before accessing name
                              }
                            : null
                        }
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Created At field */}
                <FormField
                  control={form.control}
                  name="created_at"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-semibold">
                        Created At
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="text"
                          value={
                            initialData
                              ? initialData.created_at
                              : new Date().toISOString()
                          }
                          readOnly
                          className="text-gray-500"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            <button
              type="submit"
              className="bg-gradient-to-r from-teal-400 to-indigo-500 hover:from-cyan-500 hover:to-red-500 ...text-white font-bold py-2 px-4 rounded ml-5 mt-3 mb-3 transition ease-in-out delay-120 hover:scale-105 ring-2 hover:ring-4"
            >
              {id ? "Update Tutorial" : "Add Tutorial"}
            </button>
          </form>
        </Form>
      </div>
    </div>
  );
};
